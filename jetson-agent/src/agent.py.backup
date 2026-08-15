import asyncio
import json
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from crypto.verification import PackageVerifier


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

SIGNING_KEY_ID = (
    "TF-RSA3072-ROOT-KEY-2026-PRIMARY"
)


class DummyCertManager:
    pass


def get_verifier() -> PackageVerifier:
    verifier = PackageVerifier(
        DummyCertManager()
    )

    verifier.public_key_path = PUBLIC_KEY_PATH
    verifier._load_public_key()

    return verifier


def create_real_signature(
    manifest: str,
) -> str:
    private_key = serialization.load_pem_private_key(
        PRIVATE_KEY_PATH.read_bytes(),
        password=None,
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