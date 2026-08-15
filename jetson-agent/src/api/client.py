"""
Backend API Client with mTLS Support
Communicates with TFrenzy backend for authentication, deployment, and licensing.
"""

import asyncio
import logging
import ssl
from datetime import datetime
from typing import Optional, Dict, Any

import aiohttp

from crypto.mtls import MTLSClient

logger = logging.getLogger(__name__)


class BackendAPIClient:
    """Client for TFrenzy backend API with mTLS."""

    def __init__(
        self,
        mtls_client: MTLSClient,
        backend_url: str,
        timeout: int = 30,
    ):
        self.mtls_client = mtls_client
        self.backend_url = backend_url.rstrip("/")
        self.timeout = timeout
        self.session = None
        self.ssl_context = None

    async def initialize(self) -> bool:
        """Initialize API client with mutual TLS."""
        logger.info("Initializing Backend API Client...")

        try:
            # Make sure mTLS client is initialized
            cert_pem, key_pem = (
                self.mtls_client.get_client_cert_key_pair()
            )

            ca_cert_path = (
                self.mtls_client.get_ca_cert_path()
            )

            cert_path = self.mtls_client.cert_manager.cert_path
            key_path = self.mtls_client.cert_manager.key_path

            if not cert_path.exists():
                raise FileNotFoundError(
                    f"Client certificate not found: {cert_path}"
                )

            if not key_path.exists():
                raise FileNotFoundError(
                    f"Client private key not found: {key_path}"
                )

            if not ca_cert_path:
                raise FileNotFoundError(
                    "CA certificate path is not configured"
                )

            # Create TLS context
            self.ssl_context = ssl.create_default_context(
                purpose=ssl.Purpose.SERVER_AUTH,
                cafile=ca_cert_path,
            )

            # Load client certificate + private key
            self.ssl_context.load_cert_chain(
                certfile=str(cert_path),
                keyfile=str(key_path),
            )

            # Verify backend certificate
            self.ssl_context.check_hostname = False

            logger.info("mTLS SSL context created successfully")
            logger.info(
                "Client certificate loaded: %s",
                cert_path,
            )

            return True

        except Exception as exc:
            logger.error(
                "Failed to initialize API client: %s",
                exc,
            )
            return False

    async def _ensure_session(self):
        """Ensure aiohttp session exists."""
        if self.session is None or self.session.closed:

            if self.ssl_context is None:
                raise RuntimeError(
                    "SSL context is not initialized"
                )

            connector = aiohttp.TCPConnector(
                ssl=self.ssl_context
            )

            self.session = aiohttp.ClientSession(
                connector=connector
            )

    async def authenticate_device(
        self,
        device_id: str,
        nonce_challenge: str,
    ) -> Dict[str, Any]:
        """Authenticate device using challenge-response."""

        logger.info(
            "Authenticating device %s...",
            device_id,
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            f"/api/auth/device-challenge"
        )

        payload = {
            "deviceId": device_id,
            "nonceChallenge": nonce_challenge,
            "timestamp": (
                datetime.utcnow().isoformat() + "Z"
            ),
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                timeout=self.timeout,
            ) as resp:

                if resp.status == 200:
                    result = await resp.json()

                    logger.info(
                        "Device authentication successful"
                    )

                    return result

                error = await resp.text()

                logger.error(
                    "Device authentication failed: "
                    "%s - %s",
                    resp.status,
                    error,
                )

                return {
                    "success": False,
                    "error": error,
                }

        except asyncio.TimeoutError:
            logger.error(
                "Device authentication timeout"
            )

            return {
                "success": False,
                "error": "Request timeout",
            }

        except Exception as exc:
            logger.error(
                "Device authentication error: %s",
                exc,
            )

            return {
                "success": False,
                "error": str(exc),
            }

    async def get_deployment(
        self,
        device_id: str,
        deployment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieve deployment assigned to device."""

        logger.info(
            "Retrieving deployment for device %s...",
            device_id,
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            f"/api/deployments/device/{device_id}"
        )

        if deployment_id:
            endpoint += (
                f"?deploymentId={deployment_id}"
            )

        try:
            async with self.session.get(
                endpoint,
                timeout=self.timeout,
            ) as resp:

                if resp.status == 200:
                    result = await resp.json()

                    logger.info(
                        "Deployment retrieved: %s",
                        result.get("id"),
                    )

                    return result

                error = await resp.text()

                logger.error(
                    "Failed to retrieve deployment: "
                    "%s - %s",
                    resp.status,
                    error,
                )

                return {
                    "success": False,
                    "error": error,
                }

        except asyncio.TimeoutError:
            logger.error(
                "Deployment retrieval timeout"
            )

            return {
                "success": False,
                "error": "Request timeout",
            }

        except Exception as exc:
            logger.error(
                "Deployment retrieval error: %s",
                exc,
            )

            return {
                "success": False,
                "error": str(exc),
            }

    async def get_model_package(
        self,
        model_id: str,
        version: str,
    ) -> Dict[str, Any]:
        """Retrieve encrypted model package metadata."""

        logger.info(
            "Retrieving model package %s v%s...",
            model_id,
            version,
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            f"/api/models/{model_id}/packages/{version}"
        )

        try:
            async with self.session.get(
                endpoint,
                timeout=self.timeout,
            ) as resp:

                if resp.status == 200:
                    result = await resp.json()

                    logger.info(
                        "Model package metadata retrieved"
                    )

                    return result

                error = await resp.text()

                logger.error(
                    "Failed to retrieve model package: "
                    "%s - %s",
                    resp.status,
                    error,
                )

                return {
                    "success": False,
                    "error": error,
                }

        except asyncio.TimeoutError:
            logger.error(
                "Model package retrieval timeout"
            )

            return {
                "success": False,
                "error": "Request timeout",
            }

        except Exception as exc:
            logger.error(
                "Model package retrieval error: %s",
                exc,
            )

            return {
                "success": False,
                "error": str(exc),
            }

    async def request_key_release(
        self,
        device_id: str,
        deployment_id: str,
        model_package_hash: str,
        nonce: str,
    ) -> Dict[str, Any]:
        """Request temporary model decryption key."""

        logger.info(
            "Requesting key release for deployment %s...",
            deployment_id,
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            "/api/licenses/key-release"
        )

        payload = {
            "deviceId": device_id,
            "deploymentId": deployment_id,
            "packageHash": model_package_hash,
            "nonce": nonce,
            "timestamp": (
                datetime.utcnow().isoformat() + "Z"
            ),
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                timeout=self.timeout,
            ) as resp:

                if resp.status == 200:
                    result = await resp.json()

                    logger.info(
                        "Key release approved"
                    )

                    return result

                if resp.status == 403:
                    logger.error(
                        "Key release denied: "
                        "Unauthorized device or deployment"
                    )

                    return {
                        "success": False,
                        "error": "Unauthorized",
                    }

                if resp.status == 410:
                    logger.error(
                        "Key release denied: "
                        "Deployment expired or revoked"
                    )

                    return {
                        "success": False,
                        "error": "Deployment not active",
                    }

                error = await resp.text()

                logger.error(
                    "Key release failed: %s - %s",
                    resp.status,
                    error,
                )

                return {
                    "success": False,
                    "error": error,
                }

        except asyncio.TimeoutError:
            logger.error(
                "Key release request timeout"
            )

            return {
                "success": False,
                "error": "Request timeout",
            }

        except Exception as exc:
            logger.error(
                "Key release error: %s",
                exc,
            )

            return {
                "success": False,
                "error": str(exc),
            }

    async def renew_activation_license(
        self,
        device_id: str,
        deployment_id: str,
    ) -> Dict[str, Any]:
        """Renew activation license."""

        logger.info(
            "Renewing activation license for deployment %s...",
            deployment_id,
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            "/api/licenses/renew"
        )

        payload = {
            "deviceId": device_id,
            "deploymentId": deployment_id,
            "timestamp": (
                datetime.utcnow().isoformat() + "Z"
            ),
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                timeout=self.timeout,
            ) as resp:

                if resp.status == 200:
                    result = await resp.json()

                    logger.info(
                        "License renewal successful"
                    )

                    return result

                if resp.status == 410:
                    return {
                        "success": False,
                        "error": "Deployment not active",
                    }

                error = await resp.text()

                return {
                    "success": False,
                    "error": error,
                }

        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Request timeout",
            }

        except Exception as exc:
            return {
                "success": False,
                "error": str(exc),
            }

    async def report_status(
        self,
        device_id: str,
        status_data: Dict[str, Any],
    ) -> bool:
        """Send device status to backend."""

        logger.info(
            "Sending status report to backend..."
        )

        await self._ensure_session()

        endpoint = (
            f"{self.backend_url}"
            f"/api/devices/{device_id}/status"
        )

        payload = {
            "timestamp": (
                datetime.utcnow().isoformat() + "Z"
            ),
            **status_data,
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                timeout=10,
            ) as resp:

                if resp.status == 200:
                    logger.info(
                        "Status report successful"
                    )
                    return True

                error = await resp.text()

                logger.warning(
                    "Status report failed: %s - %s",
                    resp.status,
                    error,
                )

                return False

        except Exception as exc:
            logger.warning(
                "Failed to send status report: %s",
                exc,
            )

            return False

    async def close(self):
        """Close API client session."""

        if self.session:
            await self.session.close()
            self.session = None

            logger.info(
                "API client session closed"
            )
