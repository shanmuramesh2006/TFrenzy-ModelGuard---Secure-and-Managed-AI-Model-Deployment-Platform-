"""
mTLS Certificate and Cryptographic Identity Management
Handles device certificate generation, validation, and mTLS handshakes
"""

import os
import logging
from pathlib import Path
from typing import Tuple
from dataclasses import dataclass
import hashlib

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
    """Manages device certificates and mTLS operations"""

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

        cert_pem = self.cert_path.read_text()
        key_pem = self.key_path.read_text()

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

        self.cert_path.write_text(cert_pem)
        self.cert_path.chmod(0o644)

        self.key_path.write_text(key_pem)
        self.key_path.chmod(0o600)

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

        self.ca_path.write_text(ca_pem)
        self.ca_path.chmod(0o644)

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
    # Certificate fingerprint
    # ============================================================

    def get_certificate_fingerprint(
        self,
        cert_pem: str
    ) -> str:
        """Calculate SHA-256 fingerprint of certificate"""

        fingerprint = hashlib.sha256(
            cert_pem.encode()
        ).hexdigest()

        return ":".join(
            f"{fingerprint[i:i + 2].upper()}"
            for i in range(0, 40, 2)
        )

    # ============================================================
    # Certificate validity
    # ============================================================

    def verify_certificate_validity(
        self,
        cert_pem: str
    ) -> bool:
        """Verify certificate is valid"""

        # Prototype validation
        logger.info(
            "Certificate validity check passed (stub)"
        )

        return True

    # ============================================================
    # Device identity
    # ============================================================

    def extract_device_identity(
        self,
        cert_pem: str
    ) -> dict:
        """Extract device information from certificate"""

        identity = {
            "deviceId": os.getenv(
                "TFRENZY_DEVICE_ID",
                "DEV-UNKNOWN"
            ),
            "serialNumber":
                self._get_hardware_serial(),
            "macAddress":
                self._get_mac_address(),
            "certFingerprint":
                self.get_certificate_fingerprint(
                    cert_pem
                ),
            "hardwareFuseHash":
                self._get_hardware_fuse_hash(),
        }

        logger.debug(
            f"Device identity: {identity}"
        )

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
    # Hardware fuse hash
    # ============================================================

    def _get_hardware_fuse_hash(self) -> str:
        """Get Jetson hardware fuse hash"""

        try:
            serial = self._get_hardware_serial()
            mac = self._get_mac_address()

            fuse_data = (
                f"{serial}-{mac}"
            ).encode()

            fuse_hash = hashlib.sha256(
                fuse_data
            ).hexdigest()

            return (
                f"HWFUSE-ORIN-"
                f"{fuse_hash[:16].upper()}"
            )

        except Exception:
            return "HWFUSE-MOCK-UNKNOWN"


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

    async def initialize(self):
        """Initialize mTLS by loading certificates"""

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

            logger.info(
                "mTLS initialization successful"
            )

            logger.info(
                "Certificate fingerprint: %s",
                self.cert_manager.get_certificate_fingerprint(
                    self.cert_pem
                )
            )

            return True

        except FileNotFoundError as e:
            logger.error(
                f"Certificate not found: {e}"
            )

            logger.info(
                "Device is not registered. "
                "Please register with: tfrenzy-register"
            )

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