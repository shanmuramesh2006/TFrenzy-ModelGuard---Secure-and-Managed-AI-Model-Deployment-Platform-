"""
Background License Renewal Service
Periodically renews the model activation license to maintain deployment
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class LicenseRenewalService:
    """Handles background license renewal"""
    
    def __init__(self, api_client, device_id: str, deployment_id: str, 
                 interval_hours: int = 12):
        self.api_client = api_client
        self.device_id = device_id
        self.deployment_id = deployment_id
        self.interval_hours = interval_hours
        self.is_running = False
        self.next_renewal_time = None
    
    async def run(self):
        """Run the license renewal loop"""
        logger.info("License renewal service started")
        self.is_running = True
        
        # Calculate first renewal time
        self.next_renewal_time = datetime.utcnow() + timedelta(hours=self.interval_hours)
        logger.info(f"Next renewal scheduled for: {self.next_renewal_time}")
        
        while self.is_running:
            try:
                # Calculate time until next renewal
                now = datetime.utcnow()
                time_until_renewal = (self.next_renewal_time - now).total_seconds()
                
                if time_until_renewal <= 0:
                    # Time to renew
                    await self._perform_renewal()
                    
                    # Schedule next renewal
                    self.next_renewal_time = datetime.utcnow() + timedelta(hours=self.interval_hours)
                    logger.info(f"Next renewal scheduled for: {self.next_renewal_time}")
                
                # Wait before checking again (every 60 seconds)
                await asyncio.sleep(min(60, time_until_renewal))
                
            except Exception as e:
                logger.error(f"License renewal error: {e}")
                # Continue trying even on error
                await asyncio.sleep(60)
    
    async def _perform_renewal(self):
        """Perform actual license renewal"""
        logger.info("=" * 60)
        logger.info("BACKGROUND: License Renewal")
        logger.info("=" * 60)
        
        try:
            result = await self.api_client.renew_activation_license(
                self.device_id,
                self.deployment_id
            )
            
            if result.get("success", True):
                logger.info("✓ License renewed successfully")
                logger.info(f"  New expiry: {result.get('expiresAt', 'N/A')}")
            else:
                error = result.get("error", "Unknown error")
                
                if error == "Deployment not active":
                    logger.critical("✗ Deployment has been revoked or expired")
                    logger.critical("  Model access will terminate on next restart")
                    self.is_running = False
                else:
                    logger.error(f"✗ License renewal failed: {error}")
                    
        except Exception as e:
            logger.error(f"License renewal exception: {e}")
    
    async def stop(self):
        """Stop the license renewal service"""
        logger.info("Stopping license renewal service...")
        self.is_running = False
