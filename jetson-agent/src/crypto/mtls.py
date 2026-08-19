"""
mTLS Certificate and Cryptographic Identity Management
Handles device certificate validation, DER fingerprinting, challenge signing, and mTLS operations
"""

import os
import logging
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass
import hashlib
from datetime import datetime, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, ec
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)


@dataclass
class DeviceCertificate:
    """Device certificate information"""

    device_id: str
    serial_number: str
    mac_address: str
    cert_pem: str
    key_pem: str
    cert_fingerprint: str
    cert_expires_at: str
    public_key: str
    hardware_fuse_hash: str
    issuer: str

    def to_dict(self) -> dict:
        return {
            "deviceId": self.device_id,
            "serialNumber": self.serial_number,
            "macAddress": self.mac_address,
            "certFingerprint": self.cert_fingerprint,
            "certExpiresAt": self.cert_expires_at,
            "publicKey": self.public_key,
            "hardwareFuseHash": self.hardware_fuse_hash,
            "issuer": self.issuer,
        }


class CertificateManager:
    """Manages device certificates, validation, and cryptographic operations"""

    def __init__(
        self,
        cert_path: str,
        key_path: str,
        ca_path: str
    ):
        self.cert_path = Path(cert_path)
        self.key_path = Path(key_path)
        self.ca_path = Path(ca_path)

        self.cert_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

    def load_certificate(self) -> Tuple[str, str]:
        """Load existing certificate and key from disk"""

        if (
            not self.cert_path.exists()
            or not self.key_path.exists()
        ):
            raise FileNotFoundError(
                f"Certificate not found at "
                f"{self.cert_path} or {self.key_path}. "
                "Device must be registered first."
            )

        cert_pem = self.cert_path.read_text(encoding="utf-8")
        key_pem = self.key_path.read_text(encoding="utf-8")

        logger.info(
            f"Loaded device certificate: {self.cert_path}"
        )

        logger.info(
            f"Loaded device private key: {self.key_path}"
        )

        return cert_pem, key_pem

    def save_certificate(
        self,
        cert_pem: str,
        key_pem: str
    ):
        """Save certificate and key to disk"""

        self.cert_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        self.cert_path.write_text(cert_pem, encoding="utf-8")
        try:
            self.cert_path.chmod(0o644)
        except OSError:
            pass

        self.key_path.write_text(key_pem, encoding="utf-8")
        try:
            self.key_path.chmod(0o600)
        except OSError:
            pass

        logger.info(
            f"Saved device certificate to {self.cert_path}"
        )

        logger.info(
            f"Saved device private key to {self.key_path}"
        )

    def save_ca_certificate(self, ca_pem: str):
        """Save CA certificate for verification"""

        self.ca_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        self.ca_path.write_text(ca_pem, encoding="utf-8")
        try:
            self.ca_path.chmod(0o644)
        except OSError:
            pass

        logger.info(
            f"Saved CA certificate to {self.ca_path}"
        )

    # ============================================================
    # Certificate path getters
    # ============================================================

    def get_cert_path(self) -> str:
        """Get device certificate file path"""
        return str(self.cert_path)

    def get_key_path(self) -> str:
        """Get device private key file path"""
        return str(self.key_path)

    def get_ca_path(self) -> str:
        """Get CA certificate file path"""
        return str(self.ca_path)

    # ============================================================
    # Certificate fingerprint (Standard DER SHA-256)
    # ============================================================

    def get_certificate_fingerprint(
        self,
        cert_pem: str
    ) -> str:
        """
        Calculate standard X.509 SHA-256 fingerprint:
        SHA-256 over certificate DER bytes, formatted as uppercase colon-separated hex (64 hex characters).
        """
        try:
            cert = x509.load_pem_x509_certificate(cert_pem.encode("utf-8"))
            der_bytes = cert.public_bytes(serialization.Encoding.DER)
            digest = hashlib.sha256(der_bytes).hexdigest().upper()
            return ":".join(digest[i:i + 2] for i in range(0, len(digest), 2))
        except Exception as exc:
            logger.error(f"Failed to calculate certificate fingerprint: {exc}")
            raise ValueError(f"Malformed certificate PEM: {exc}") from exc

    # ============================================================
    # Certificate validity (Genuine X.509 Validation)
    # ============================================================

    def verify_certificate_validity(
        self,
        cert_pem: str,
        ca_pem: Optional[str] = None
    ) -> bool:
        """
        Verify that certificate is genuine, unexpired, supported, and signed by trusted CA.

        Checks:
        1. PEM parsing and structure
        2. Validity period: not_valid_before <= current_time <= not_valid_after
        3. Public key algorithm and strength (RSA >= 2048 or ECC)
        4. CA trust chain: issuer matches CA subject and signature verifies with CA public key
        """
        try:
            # 1. Parse device certificate
            cert = x509.load_pem_x509_certificate(cert_pem.encode("utf-8"))

            # 2. Check validity dates
            now = datetime.now(timezone.utc)
            if now < cert.not_valid_before_utc:
                logger.error(
                    f"Certificate is not yet valid. Not valid before: {cert.not_valid_before_utc.isoformat()}, current time: {now.isoformat()}"
                )
                return False

            if now > cert.not_valid_after_utc:
                logger.error(
                    f"Certificate has expired. Not valid after: {cert.not_valid_after_utc.isoformat()}, current time: {now.isoformat()}"
                )
                return False

            # 3. Check public key type and strength
            pub_key = cert.public_key()
            if isinstance(pub_key, rsa.RSAPublicKey):
                if pub_key.key_size < 2048:
                    logger.error(f"Certificate RSA public key is too weak: {pub_key.key_size} bits (minimum 2048 required)")
                    return False
            elif isinstance(pub_key, ec.EllipticCurvePublicKey):
                pass  # ECC key is accepted
            else:
                logger.error(f"Unsupported certificate public key algorithm: {type(pub_key).__name__}")
                return False

            # 4. Check CA trust chain if CA certificate is available
            ca_cert_pem = ca_pem
            if not ca_cert_pem and self.ca_path.exists():
                try:
                    ca_cert_pem = self.ca_path.read_text(encoding="utf-8")
                except Exception as exc:
                    logger.warning(f"Could not read CA certificate from {self.ca_path}: {exc}")

            if ca_cert_pem:
                try:
                    ca_cert = x509.load_pem_x509_certificate(ca_cert_pem.encode("utf-8"))

                    # Check CA validity period
                    if now < ca_cert.not_valid_before_utc or now > ca_cert.not_valid_after_utc:
                        logger.error("CA certificate is expired or not yet valid")
                        return False

                    # Check Issuer matches CA Subject
                    if cert.issuer != ca_cert.subject:
                        logger.error(
                            f"Certificate issuer ({cert.issuer.rfc4514_string()}) does not match CA subject ({ca_cert.subject.rfc4514_string()})"
                        )
                        return False

                    # Verify signature of device certificate using CA public key
                    ca_pub_key = ca_cert.public_key()
                    if isinstance(ca_pub_key, rsa.RSAPublicKey):
                        ca_pub_key.verify(
                            cert.signature,
                            cert.tbs_certificate_bytes,
                            padding.PKCS1v15(),
                            cert.signature_hash_algorithm,
                        )
                    elif isinstance(ca_pub_key, ec.EllipticCurvePublicKey):
                        ca_pub_key.verify(
                            cert.signature,
                            cert.tbs_certificate_bytes,
                            ec.ECDSA(cert.signature_hash_algorithm),
                        )
                    else:
                        logger.error(f"Unsupported CA key type: {type(ca_pub_key).__name__}")
                        return False

                    logger.info("Certificate CA trust chain verified successfully")

                except InvalidSignature:
                    logger.error("Certificate signature verification failed against CA public key")
                    return False
                except Exception as exc:
                    logger.error(f"CA chain verification error: {exc}")
                    return False

            logger.info("X.509 certificate validity check passed successfully")
            return True

        except Exception as exc:
            logger.error(f"Certificate validity check failed: {exc}")
            return False

    # ============================================================
    # Challenge Signing (Proof of Possession)
    # ============================================================

    def sign_challenge(self, challenge_str: str, key_pem: Optional[str] = None) -> str:
        """
        Sign a challenge string using the device's private key.
        Uses RSA-PSS with SHA-256 and salt length = 32 bytes (matching backend verification).
        """
        try:
            if not key_pem:
                _, key_pem = self.load_certificate()

            private_key = serialization.load_pem_private_key(
                key_pem.encode("utf-8"),
                password=None
            )

            data_bytes = challenge_str.encode("utf-8")

            if isinstance(private_key, rsa.RSAPrivateKey):
                signature = private_key.sign(
                    data_bytes,
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=32,
                    ),
                    hashes.SHA256(),
                )
            elif isinstance(private_key, ec.EllipticCurvePrivateKey):
                signature = private_key.sign(
                    data_bytes,
                    ec.ECDSA(hashes.SHA256())
                )
            else:
                raise ValueError(f"Unsupported private key type: {type(private_key).__name__}")

            return signature.hex()

        except Exception as exc:
            logger.error(f"Failed to sign challenge: {exc}")
            raise

    # ============================================================
    # Device identity
    # ============================================================

    def extract_device_identity(
        self,
        cert_pem: str
    ) -> dict:
        """Extract device identity from the validated X.509 certificate and hardware"""
        try:
            cert = x509.load_pem_x509_certificate(cert_pem.encode("utf-8"))
            fingerprint = self.get_certificate_fingerprint(cert_pem)
            pub_key_pem = cert.public_key().public_bytes(
                serialization.Encoding.PEM,
                serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode("utf-8")
            expires_at = cert.not_valid_after_utc.isoformat()
            issuer_str = cert.issuer.rfc4514_string()

            # Attempt to extract common name from subject
            common_name = None
            for attr in cert.subject:
                if attr.oid == x509.NameOID.COMMON_NAME:
                    common_name = attr.value
                    break

            device_id = os.getenv("TFRENZY_DEVICE_ID") or common_name or "DEV-UNKNOWN"
        except Exception as exc:
            logger.warning(f"Could not parse certificate for identity extraction: {exc}")
            fingerprint = ""
            pub_key_pem = ""
            expires_at = ""
            issuer_str = ""
            device_id = os.getenv("TFRENZY_DEVICE_ID", "DEV-UNKNOWN")

        identity = {
            "deviceId": device_id,
            "serialNumber": self._get_hardware_serial(),
            "macAddress": self._get_mac_address(),
            "certFingerprint": fingerprint,
            "certExpiresAt": expires_at,
            "publicKey": pub_key_pem,
            "issuer": issuer_str,
            "hardwareFuseHash": self._get_hardware_fuse_hash(),
        }

        logger.debug(f"Device identity: {identity}")
        return identity

    # ============================================================
    # Hardware serial
    # ============================================================

    def _get_hardware_serial(self) -> str:
        """Get device hardware serial number"""

        try:
            with open(
                "/proc/device-tree/serial-number",
                "r"
            ) as f:
                return f.read().strip()

        except Exception:
            return (
                f"MOCK-SERIAL-"
                f"{os.getenv('HOSTNAME', 'jetson')}"
            )

    # ============================================================
    # MAC address
    # ============================================================

    def _get_mac_address(self) -> str:
        """Get primary network interface MAC address"""

        try:
            import socket
            import fcntl
            import struct

            def get_mac(ifname):
                s = socket.socket(
                    socket.AF_INET,
                    socket.SOCK_DGRAM
                )

                try:
                    return ":".join(
                        map(
                            lambda x: "%02x" % x,
                            fcntl.ioctl(
                                s.fileno(),
                                0x8927,
                                struct.pack(
                                    "256s",
                                    ifname.encode("utf_8")
                                )
                            )[-6:]
                        )
                    )

                except Exception:
                    return None

                finally:
                    s.close()

            mac = (
                get_mac("eth0")
                or get_mac("enp0s31f6")
                or "00:00:00:00:00:00"
            )

            return mac

        except Exception:
            return "00:00:00:00:00:00"

    # ============================================================
    # Hardware identity hash (Prototype: serial + MAC based)
    # Note: Not a real silicon hardware fuse attestation.
    # ============================================================

    def _get_hardware_fuse_hash(self) -> str:
        """
        Get prototype hardware identity hash derived from serial number and MAC address.
        Note: This is a prototype hardware identity measurement and not physical NVIDIA fuse attestation.
        """
        try:
            serial = self._get_hardware_serial()
            mac = self._get_mac_address()

            fuse_data = f"{serial}-{mac}".encode("utf-8")
            fuse_hash = hashlib.sha256(fuse_data).hexdigest()

            return f"PROTOTYPE-HWID-{fuse_hash[:16].upper()}"

        except Exception:
            return "PROTOTYPE-HWID-MOCK-UNKNOWN"


class MTLSClient:
    """mTLS client for secure communication with backend"""

    def __init__(
        self,
        cert_manager: CertificateManager,
        backend_url: str
    ):
        self.cert_manager = cert_manager
        self.backend_url = backend_url
        self.cert_pem = None
        self.key_pem = None

    async def initialize(self) -> bool:
        """Initialize mTLS by loading and validating certificates"""

        logger.info("Initializing mTLS client...")

        try:
            self.cert_pem, self.key_pem = (
                self.cert_manager.load_certificate()
            )

            if not self.cert_manager.verify_certificate_validity(
                self.cert_pem
            ):
                raise RuntimeError(
                    "Device certificate is invalid or expired"
                )

            fingerprint = self.cert_manager.get_certificate_fingerprint(
                self.cert_pem
            )

            logger.info("mTLS certificate verification passed")
            logger.info(f"Certificate fingerprint: {fingerprint}")

            return True

        except FileNotFoundError as e:
            logger.error(f"Certificate not found: {e}")
            logger.info(
                "Device is not provisioned. "
                "Please ensure certificate and private key are installed."
            )
            return False

        except Exception as e:
            logger.error(f"mTLS initialization failed: {e}")
            return False

    def get_client_cert_key_pair(
        self
    ) -> Tuple[str, str]:
        """Get client certificate and key for mTLS"""

        if not self.cert_pem or not self.key_pem:
            raise RuntimeError(
                "mTLS not initialized. "
                "Call initialize() first."
            )

        return self.cert_pem, self.key_pem

    def get_ca_cert_path(self) -> str:
        """Get path to CA certificate for verification"""
        return self.cert_manager.get_ca_path()

    def get_client_cert_path(self) -> str:
        """Get path to device client certificate"""
        return self.cert_manager.get_cert_path()

    def get_client_key_path(self) -> str:
        """Get path to device private key"""
        return self.cert_manager.get_key_path()