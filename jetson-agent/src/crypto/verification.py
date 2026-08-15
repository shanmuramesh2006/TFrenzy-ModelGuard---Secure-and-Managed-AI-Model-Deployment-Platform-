"""
Package Verification

Verifies:
- RSA-3072-PSS digital signatures
- SHA-256 package integrity

The trusted TFrenzy public signing key is loaded from
the project keys directory unless overridden by the
TFRENZY_SIGNING_PUBLIC_KEY environment variable.
"""

import hashlib
import logging
import os
from pathlib import Path
from typing import Any, Dict

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

logger = logging.getLogger(__name__)


class PackageVerifier:
    """Verifies TFrenzy model package signatures and hashes."""

    DEFAULT_KEY_PATH = (
        Path(__file__).resolve().parents[3]
        / "keys"
        / "modelguard-public.pem"
    )

    EXPECTED_SIGNING_KEY_ID = (
        "TF-RSA3072-ROOT-KEY-2026-PRIMARY"
    )

    def __init__(self, cert_manager):
        self.cert_manager = cert_manager

        key_path = os.getenv(
            "TFRENZY_SIGNING_PUBLIC_KEY",
            str(self.DEFAULT_KEY_PATH),
        )

        self.public_key_path = Path(key_path)
        self.public_key = None

        self._load_public_key()

    def _load_public_key(self) -> None:
        """Load the trusted RSA public key from PEM."""
        try:
            if not self.public_key_path.exists():
                raise FileNotFoundError(
                    f"Signing public key not found: "
                    f"{self.public_key_path}"
                )

            public_key_data = (
                self.public_key_path.read_bytes()
            )

            self.public_key = (
                serialization.load_pem_public_key(
                    public_key_data
                )
            )

            logger.info(
                "Loaded TFrenzy signing public key: %s",
                self.public_key_path,
            )

        except Exception as exc:
            logger.error(
                "Failed to load TFrenzy signing public key: %s",
                exc,
            )
            self.public_key = None

    @staticmethod
    def _get_manifest_bytes(
        package: Dict[str, Any],
    ) -> bytes | None:
        """
        Build the exact bytes that were signed.

        Preferred source:
          package["manifestJson"]

        Alternate source:
          package["manifest_json"]

        If a manifest is supplied as a dictionary,
        use compact JSON with deterministic separators.
        """
        manifest = package.get("manifestJson")

        if manifest is None:
            manifest = package.get(
                "manifest_json"
            )

        if manifest is None:
            manifest = package.get("manifest")

        if manifest is None:
            return None

        if isinstance(manifest, bytes):
            return manifest

        if isinstance(manifest, str):
            return manifest.encode("utf-8")

        if isinstance(manifest, dict):
            import json

            return json.dumps(
                manifest,
                separators=(",", ":"),
            ).encode("utf-8")

        return None

    @staticmethod
    def _get_signature_hex(
        package: Dict[str, Any],
    ) -> str | None:
        """
        Support both frontend/backend field names.
        """
        signature = package.get(
            "manifestSignature"
        )

        if signature is None:
            signature = package.get(
                "manifest_sig_hex"
            )

        if signature is None:
            signature = package.get(
                "signature"
            )

        if not signature:
            return None

        return str(signature).strip()

    async def verify_signature(
        self,
        package: Dict[str, Any],
    ) -> bool:
        """
        Verify a real RSA-3072-PSS signature.

        The signature must be over the exact package
        manifest bytes and verified using the trusted
        TFrenzy public signing key.
        """
        try:
            signing_key_id = package.get(
                "signingKeyId"
            )

            if signing_key_id is None:
                signing_key_id = package.get(
                    "signing_key_id"
                )

            if not signing_key_id:
                logger.error(
                    "Missing signing key ID"
                )
                return False

            if (
                signing_key_id
                != self.EXPECTED_SIGNING_KEY_ID
            ):
                logger.error(
                    "Untrusted signing key ID: %s",
                    signing_key_id,
                )
                return False

            if self.public_key is None:
                logger.error(
                    "Trusted signing public key is unavailable"
                )
                return False

            manifest_bytes = (
                self._get_manifest_bytes(package)
            )

            if manifest_bytes is None:
                logger.error(
                    "Package manifest is missing"
                )
                return False

            signature_hex = (
                self._get_signature_hex(package)
            )

            if not signature_hex:
                logger.error(
                    "Package signature is missing"
                )
                return False

            try:
                signature_bytes = bytes.fromhex(
                    signature_hex
                )
            except ValueError:
                logger.error(
                    "Package signature is not valid hexadecimal"
                )
                return False

            # RSA-3072 produces a 384-byte signature.
            if len(signature_bytes) != 384:
                logger.error(
                    "Invalid RSA-3072 signature length: %d bytes",
                    len(signature_bytes),
                )
                return False

            self.public_key.verify(
                signature_bytes,
                manifest_bytes,
                padding.PSS(
                    mgf=padding.MGF1(
                        hashes.SHA256()
                    ),
                    salt_length=32,
                ),
                hashes.SHA256(),
            )

            logger.info(
                "RSA-3072-PSS signature verification passed"
            )
            logger.info(
                "Signing Key ID: %s",
                signing_key_id,
            )

            return True

        except InvalidSignature:
            logger.error(
                "RSA-3072-PSS signature verification FAILED"
            )
            return False

        except Exception as exc:
            logger.error(
                "Signature verification error: %s",
                exc,
            )
            return False

    async def verify_hash(
        self,
        package: Dict[str, Any],
        file_data: bytes,
    ) -> bool:
        """
        Verify SHA-256 hash of the encrypted package.
        """
        try:
            stored_hash = package.get(
                "packageHash"
            )

            if stored_hash is None:
                stored_hash = package.get(
                    "package_hash"
                )

            if not stored_hash:
                logger.error(
                    "No package hash to verify"
                )
                return False

            calculated_hash = hashlib.sha256(
                file_data
            ).hexdigest()

            if (
                calculated_hash.lower()
                == str(stored_hash).lower()
            ):
                logger.info(
                    "SHA-256 package hash verification passed"
                )
                return True

            logger.error(
                "Package hash mismatch!"
            )
            logger.error(
                "Stored: %s",
                stored_hash,
            )
            logger.error(
                "Calculated: %s",
                calculated_hash,
            )

            return False

        except Exception as exc:
            logger.error(
                "Hash verification error: %s",
                exc,
            )
            return False
