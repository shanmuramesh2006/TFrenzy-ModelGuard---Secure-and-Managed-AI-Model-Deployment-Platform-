"""
TFrenzy Secure Jetson Agent

Main orchestration layer for:
- Device configuration
- Backend communication
- Package signature verification
- Package hash verification
- Secure shutdown

TensorRT execution can be attached after deployment/package
authorization is confirmed.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from config import AgentConfig
from api.client import BackendAPIClient
from crypto.mtls import CertificateManager, MTLSClient
from crypto.verification import PackageVerifier
from crypto.nonce import NonceManager
from crypto.encryption import EncryptionManager
from runtime.memory import MemoryManager


logger = logging.getLogger(__name__)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

PUBLIC_KEY_PATH = (
    PROJECT_ROOT
    / "keys"
    / "modelguard-public.pem"
)

PRIVATE_KEY_PATH = (
    PROJECT_ROOT
    / "keys"
    / "modelguard-private.pem"
)

SIGNING_KEY_ID = "TF-RSA3072-ROOT-KEY-2026-PRIMARY"


class SecureJetsonAgent:
    """Main TFrenzy secure agent."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.running = False

        logger.info("Initializing SecureJetsonAgent...")

        # Device certificate manager
        self.cert_manager = CertificateManager(
            config.device_cert_path,
            config.device_key_path,
            config.ca_cert_path,
        )

        # mTLS client
        self.mtls_client = MTLSClient(
            self.cert_manager,
            config.backend_url,
        )

        # Backend API
        self.api_client = BackendAPIClient(
            self.mtls_client,
            config.backend_url,
            config.api_timeout,
        )

        # Security components
        self.verifier = PackageVerifier(
            self.cert_manager
        )

        self.nonce_manager = NonceManager()
        self.encryption_manager = EncryptionManager()

        self.memory_manager = MemoryManager(
            enable_memory_encryption=
                config.enable_memory_encryption
        )

        logger.info("SecureJetsonAgent initialized")

    async def initialize(self) -> bool:
        """Initialize security and backend components."""

        logger.info("=" * 70)
        logger.info("Initializing TFrenzy Secure Agent")
        logger.info("=" * 70)

        # Initialize mTLS
        mtls_ok = await self.mtls_client.initialize()

        if not mtls_ok:
            logger.error(
                "mTLS initialization failed"
            )
            return False

        # Initialize backend API
        api_ok = await self.api_client.initialize()

        if not api_ok:
            logger.error(
                "Backend API initialization failed"
            )
            return False

        # Make sure cache directory exists
        Path(
            self.config.model_cache_dir
        ).mkdir(
            parents=True,
            exist_ok=True,
        )

        logger.info(
            "Secure agent initialization complete"
        )

        return True

    async def run(self):
        """Main agent loop."""

        logger.info("=" * 80)
        logger.info(
            "TFrenzy Secure Jetson Agent started"
        )
        logger.info(
            f"Device ID: {self.config.device_id}"
        )
        logger.info(
            f"Backend: {self.config.backend_url}"
        )
        logger.info("=" * 80)

        initialized = await self.initialize()

        if not initialized:
            raise RuntimeError(
                "Agent initialization failed"
            )

        self.running = True

        # Initial status
        await self._report_status(
            "online"
        )

        logger.info(
            "Agent is running. "
            "Press Ctrl+C to stop."
        )

        try:
            while self.running:
                await asyncio.sleep(5)

        except asyncio.CancelledError:
            logger.info(
                "Agent task cancelled"
            )

        finally:
            self.running = False

    async def _report_status(
        self,
        status: str,
    ):
        """Report agent status to backend."""

        try:
            result = await self.api_client.report_status(
                self.config.device_id,
                {
                    "status": status,
                    "agentVersion": "2.1.0",
                    "deploymentId":
                        self.config.deployment_id,
                },
            )

            if result:
                logger.info(
                    "Device status reported: %s",
                    status,
                )
            else:
                logger.warning(
                    "Device status report failed"
                )

        except Exception as exc:
            logger.warning(
                "Status reporting error: %s",
                exc,
            )

    async def shutdown(self):
        """Safely shut down the agent."""

        logger.info("=" * 70)
        logger.info(
            "Shutting down TFrenzy Secure Agent"
        )
        logger.info("=" * 70)

        self.running = False

        try:
            await self._report_status(
                "offline"
            )
        except Exception:
            pass

        try:
            await self.memory_manager.flush_all_buffers()
        except Exception as exc:
            logger.warning(
                "Memory cleanup error: %s",
                exc,
            )

        try:
            await self.api_client.close()
        except Exception as exc:
            logger.warning(
                "API client shutdown error: %s",
                exc,
            )

        logger.info(
            "TFrenzy Secure Agent stopped"
        )


# ------------------------------------------------------------------
# RSA signature test helpers
# ------------------------------------------------------------------

def create_real_signature(
    manifest: str,
) -> str:
    """Create RSA-3072-PSS signature for testing."""

    private_key = (
        serialization.load_pem_private_key(
            PRIVATE_KEY_PATH.read_bytes(),
            password=None,
        )
    )

    signature = private_key.sign(
        manifest.encode("utf-8"),
        padding.PSS(
            mgf=padding.MGF1(
                hashes.SHA256()
            ),
            salt_length=32,
        ),
        hashes.SHA256(),
    )

    return signature.hex()


def get_verifier() -> PackageVerifier:
    """Create package verifier for tests."""

    verifier = PackageVerifier(
        None
    )

    verifier.public_key_path = PUBLIC_KEY_PATH
    verifier._load_public_key()

    return verifier


def test_public_key_loads():
    verifier = get_verifier()

    assert verifier.public_key is not None
    assert PUBLIC_KEY_PATH.exists()


def test_valid_rsa_pss_signature_passes():
    verifier = get_verifier()

    manifest = json.dumps(
        {
            "model": "dummy_model.engine",
            "version": "v1.0.0",
            "algorithm": "AES-256-GCM",
        },
        separators=(",", ":"),
    )

    signature = create_real_signature(
        manifest
    )

    package = {
        "signingKeyId": SIGNING_KEY_ID,
        "manifestJson": manifest,
        "manifestSignature": signature,
    }

    result = asyncio.run(
        verifier.verify_signature(package)
    )

    assert result is True


def test_modified_manifest_is_rejected():
    verifier = get_verifier()

    original_manifest = json.dumps(
        {
            "model": "dummy_model.engine",
            "version": "v1.0.0",
            "algorithm": "AES-256-GCM",
        },
        separators=(",", ":"),
    )

    signature = create_real_signature(
        original_manifest
    )

    tampered_manifest = json.dumps(
        {
            "model": "tampered.engine",
            "version": "v1.0.0",
            "algorithm": "AES-256-GCM",
        },
        separators=(",", ":"),
    )

    package = {
        "signingKeyId": SIGNING_KEY_ID,
        "manifestJson": tampered_manifest,
        "manifestSignature": signature,
    }

    result = asyncio.run(
        verifier.verify_signature(package)
    )

    assert result is False


def test_invalid_signature_is_rejected():
    verifier = get_verifier()

    manifest = json.dumps(
        {
            "model": "dummy_model.engine",
            "version": "v1.0.0",
            "algorithm": "AES-256-GCM",
        },
        separators=(",", ":"),
    )

    package = {
        "signingKeyId": SIGNING_KEY_ID,
        "manifestJson": manifest,
        "manifestSignature": "00" * 384,
    }

    result = asyncio.run(
        verifier.verify_signature(package)
    )

    assert result is False


def test_wrong_signing_key_id_is_rejected():
    verifier = get_verifier()

    manifest = json.dumps(
        {
            "model": "dummy_model.engine",
            "version": "v1.0.0",
            "algorithm": "AES-256-GCM",
        },
        separators=(",", ":"),
    )

    signature = create_real_signature(
        manifest
    )

    package = {
        "signingKeyId": "ATTACKER-KEY",
        "manifestJson": manifest,
        "manifestSignature": signature,
    }

    result = asyncio.run(
        verifier.verify_signature(package)
    )

    assert result is False