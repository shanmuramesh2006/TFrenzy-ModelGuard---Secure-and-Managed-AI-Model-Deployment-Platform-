"""
Backend API Client with mTLS & Cryptographic Proof-of-Possession Support
Communicates with TFrenzy backend for authentication, deployment, licensing, and key release.
"""

import asyncio
import logging
import ssl
from datetime import datetime
from typing import Optional, Dict, Any
from urllib.parse import urlparse

import aiohttp

from crypto.mtls import MTLSClient

logger = logging.getLogger(__name__)


class BackendAPIClient:
    """Client for TFrenzy backend API with mTLS and challenge-response authentication."""

    def __init__(
        self,
        mtls_client: MTLSClient,
        backend_url: str,
        timeout: int = 30,
    ):
        self.mtls_client = mtls_client
        self.backend_url = backend_url.rstrip("/")
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None
        self.ssl_context: Optional[ssl.SSLContext] = None
        self.session_token: Optional[str] = None
        self.is_authenticated: bool = False

    async def initialize(self) -> bool:
        """Initialize API client with TLS/mTLS configuration."""
        logger.info("Initializing Backend API Client...")

        try:
            parsed_url = urlparse(self.backend_url)
            is_https = parsed_url.scheme == "https"

            if is_https:
                # mTLS configuration for HTTPS backend
                ca_cert_path = self.mtls_client.get_ca_cert_path()
                cert_path = self.mtls_client.cert_manager.cert_path
                key_path = self.mtls_client.cert_manager.key_path

                if not cert_path.exists():
                    raise FileNotFoundError(f"Client certificate not found: {cert_path}")

                if not key_path.exists():
                    raise FileNotFoundError(f"Client private key not found: {key_path}")

                if not ca_cert_path:
                    raise FileNotFoundError("CA certificate path is not configured")

                # Create TLS context verifying backend against trusted CA
                self.ssl_context = ssl.create_default_context(
                    purpose=ssl.Purpose.SERVER_AUTH,
                    cafile=ca_cert_path,
                )

                # Load client certificate + private key for mTLS
                self.ssl_context.load_cert_chain(
                    certfile=str(cert_path),
                    keyfile=str(key_path),
                )

                # Hostname verification configuration
                is_localhost = parsed_url.hostname in ("localhost", "127.0.0.1", "::1")
                if is_localhost:
                    # In localhost development mode, backend certificate CN might not match localhost
                    self.ssl_context.check_hostname = False
                    logger.info("mTLS context configured (localhost development mode)")
                else:
                    self.ssl_context.check_hostname = True
                    logger.info("mTLS context configured (strict production hostname verification enabled)")
            else:
                # Plain HTTP (local prototype testing)
                self.ssl_context = None
                logger.info(f"API client configured for HTTP mode ({self.backend_url})")

            return True

        except Exception as exc:
            logger.error(f"Failed to initialize API client: {exc}")
            return False

    async def _ensure_session(self):
        """Ensure aiohttp session exists and is open."""
        if self.session is None or self.session.closed:
            connector = (
                aiohttp.TCPConnector(ssl=self.ssl_context)
                if self.ssl_context is not None
                else aiohttp.TCPConnector()
            )
            self.session = aiohttp.ClientSession(connector=connector)

    def _get_headers(self) -> Dict[str, str]:
        """Get standard HTTP headers including session token if authenticated."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        return headers

    async def authenticate_device(
        self,
        device_id: str,
    ) -> Dict[str, Any]:
        """
        Authenticate device using RSA-PSS proof-of-possession challenge-response:
        1. Request cryptographic challenge from backend (/api/auth/device-challenge)
        2. Sign challenge UTF-8 bytes using device's private key
        3. Submit signature for backend verification (/api/auth/verify-challenge)
        4. Store authenticated session token
        """
        logger.info(f"Starting device authentication for {device_id}...")
        await self._ensure_session()

        # Step 1: Request challenge from backend
        challenge_endpoint = f"{self.backend_url}/api/auth/device-challenge"
        challenge_payload = {"deviceId": device_id}

        try:
            async with self.session.post(
                challenge_endpoint,
                json=challenge_payload,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    logger.error(f"Challenge request failed [{resp.status}]: {err_text}")
                    return {"success": False, "authenticated": False, "error": err_text}

                challenge_data = await resp.json()
                challenge = challenge_data.get("challenge")
                if not challenge:
                    logger.error("Challenge missing in backend response")
                    return {"success": False, "authenticated": False, "error": "Invalid challenge response"}

            logger.info("Cryptographic challenge received from backend")

            # Step 2: Sign challenge using device's private key
            signature_hex = self.mtls_client.cert_manager.sign_challenge(challenge)
            logger.info("Challenge successfully signed with device private key (RSA-3072-PSS)")

            # Step 3: Verify challenge with backend
            verify_endpoint = f"{self.backend_url}/api/auth/verify-challenge"
            verify_payload = {
                "deviceId": device_id,
                "challenge": challenge,
                "signature": signature_hex,
            }

            async with self.session.post(
                verify_endpoint,
                json=verify_payload,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    self.session_token = result.get("sessionToken")
                    self.is_authenticated = True
                    logger.info("Device authenticated successfully with backend")
                    return result

                err_text = await resp.text()
                logger.error(f"Device authentication rejected [{resp.status}]: {err_text}")
                return {"success": False, "authenticated": False, "error": err_text}

        except asyncio.TimeoutError:
            logger.error("Device authentication timed out")
            return {"success": False, "authenticated": False, "error": "Request timeout"}
        except Exception as exc:
            logger.error(f"Device authentication error: {exc}")
            return {"success": False, "authenticated": False, "error": str(exc)}

    async def get_deployment(
        self,
        device_id: str,
        deployment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieve deployment assigned to device."""
        logger.info(f"Retrieving deployment for device {device_id}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/deployments/device/{device_id}"
        if deployment_id:
            endpoint += f"?deploymentId={deployment_id}"

        try:
            async with self.session.get(
                endpoint,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info(f"Deployment retrieved: {result.get('id') or result.get('deployment', {}).get('id')}")
                    return result

                error = await resp.text()
                logger.error(f"Failed to retrieve deployment: {resp.status} - {error}")
                return {"success": False, "error": error}

        except asyncio.TimeoutError:
            logger.error("Deployment retrieval timeout")
            return {"success": False, "error": "Request timeout"}
        except Exception as exc:
            logger.error(f"Deployment retrieval error: {exc}")
            return {"success": False, "error": str(exc)}

    async def get_model_package(
        self,
        model_id: str,
        version: str,
    ) -> Dict[str, Any]:
        """Retrieve encrypted model package metadata."""
        logger.info(f"Retrieving model package {model_id} v{version}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/models/{model_id}/packages/{version}"

        try:
            async with self.session.get(
                endpoint,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info("Model package metadata retrieved successfully")
                    return result

                error = await resp.text()
                logger.error(f"Failed to retrieve model package: {resp.status} - {error}")
                return {"success": False, "error": error}

        except asyncio.TimeoutError:
            logger.error("Model package retrieval timeout")
            return {"success": False, "error": "Request timeout"}
        except Exception as exc:
            logger.error(f"Model package retrieval error: {exc}")
            return {"success": False, "error": str(exc)}

    async def consume_nonce(
        self,
        deployment_id: str,
        nonce: str,
    ) -> Dict[str, Any]:
        """
        Consume a single-use nonce on the backend before key release.
        Enforces atomic replay protection.
        """
        logger.info(f"Consuming single-use nonce for deployment {deployment_id}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/security/consume-nonce"
        payload = {
            "deploymentId": deployment_id,
            "nonce": nonce,
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info("Nonce consumed successfully (replay protection verified)")
                    return result

                if resp.status == 409:
                    error = await resp.text()
                    logger.warning(f"Replay attack detected! Nonce already used: {nonce}")
                    return {
                        "success": False,
                        "accepted": False,
                        "replayDetected": True,
                        "error": "Nonce has already been used",
                    }

                error = await resp.text()
                logger.error(f"Nonce consumption failed: {resp.status} - {error}")
                return {"success": False, "accepted": False, "error": error}

        except asyncio.TimeoutError:
            logger.error("Nonce consumption request timeout")
            return {"success": False, "accepted": False, "error": "Request timeout"}
        except Exception as exc:
            logger.error(f"Nonce consumption error: {exc}")
            return {"success": False, "accepted": False, "error": str(exc)}

    async def request_key_release(
        self,
        deployment_id: str,
        model_package_hash: str,
        nonce: str,
        device_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Request temporary model decryption key from server memory."""
        logger.info(f"Requesting key release for deployment {deployment_id}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/security/key-release"
        payload = {
            "deploymentId": deployment_id,
            "packageHash": model_package_hash,
            "nonce": nonce,
        }
        if device_id:
            payload["deviceId"] = device_id

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info("Key release approved by ModelGuard authorization gates")
                    return result

                if resp.status == 403:
                    logger.error("Key release denied: Unauthorized device, model, or invalid license")
                    return {"success": False, "released": False, "authorized": False, "error": "Unauthorized"}

                if resp.status == 410:
                    logger.error("Key release denied: Deployment expired or revoked")
                    return {"success": False, "released": False, "authorized": False, "error": "Deployment not active"}

                error = await resp.text()
                logger.error(f"Key release failed: {resp.status} - {error}")
                return {"success": False, "released": False, "authorized": False, "error": error}

        except asyncio.TimeoutError:
            logger.error("Key release request timeout")
            return {"success": False, "released": False, "authorized": False, "error": "Request timeout"}
        except Exception as exc:
            logger.error(f"Key release error: {exc}")
            return {"success": False, "released": False, "authorized": False, "error": str(exc)}

    async def renew_activation_license(
        self,
        device_id: str,
        deployment_id: str,
    ) -> Dict[str, Any]:
        """Renew activation license for an active deployment."""
        logger.info(f"Renewing activation license for deployment {deployment_id}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/licenses/renew"
        payload = {
            "deviceId": device_id,
            "deploymentId": deployment_id,
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=self.timeout,
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info("License renewal successful")
                    return result

                if resp.status in (403, 410):
                    error = await resp.text()
                    logger.warning(f"License renewal denied: {error}")
                    return {"success": False, "error": "Deployment not active"}

                error = await resp.text()
                return {"success": False, "error": error}

        except asyncio.TimeoutError:
            return {"success": False, "error": "Request timeout"}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def report_status(
        self,
        device_id: str,
        status_data: Dict[str, Any],
    ) -> bool:
        """Send device heartbeat / status update to backend."""
        logger.debug(f"Sending status report for device {device_id}...")
        await self._ensure_session()

        endpoint = f"{self.backend_url}/api/devices/{device_id}/status"
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            **status_data,
        }

        try:
            async with self.session.post(
                endpoint,
                json=payload,
                headers=self._get_headers(),
                timeout=10,
            ) as resp:
                if resp.status == 200:
                    logger.debug("Status report accepted")
                    return True

                error = await resp.text()
                logger.warning(f"Status report rejected [{resp.status}]: {error}")
                return False

        except Exception as exc:
            logger.warning(f"Status report communication error: {exc}")
            return False

    async def close(self):
        """Close API client session cleanly."""
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
            logger.info("API client session closed")

