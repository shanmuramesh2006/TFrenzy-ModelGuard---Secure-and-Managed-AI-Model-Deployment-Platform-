"""
Nonce Generation and Management
Prevents replay attacks on authentication and key release
"""

import logging
import os
import hashlib
from datetime import datetime
from typing import Set

logger = logging.getLogger(__name__)


class NonceManager:
    """Manages cryptographic nonces for replay protection"""
    
    def __init__(self):
        self.used_nonces: Set[str] = set()
    
    def generate_nonce(self) -> str:
        """
        Generate a unique nonce in TFrenzy format
        Format: TF-NONCE-{16 random hex}-{timestamp}
        
        Returns:
            Nonce string suitable for API requests
        """
        try:
            # Generate 16 random bytes (128-bit) = 32 hex chars
            random_part = os.urandom(16).hex()
            
            # Get current timestamp in milliseconds
            timestamp = str(int(datetime.utcnow().timestamp() * 1000))
            
            nonce = f"TF-NONCE-{random_part[:16]}-{timestamp}"
            
            logger.debug(f"Generated nonce: {nonce[:32]}...")
            
            return nonce
            
        except Exception as e:
            logger.error(f"Nonce generation error: {e}")
            raise
    
    def record_nonce(self, nonce: str) -> bool:
        """
        Record that a nonce has been used
        
        Args:
            nonce: The nonce to record
        
        Returns:
            True if nonce is new, False if already used (replay detected)
        """
        if nonce in self.used_nonces:
            logger.warning(f"Replay detected: nonce already used: {nonce[:32]}...")
            return False
        
        self.used_nonces.add(nonce)
        logger.debug(f"Nonce recorded as used: {nonce[:32]}...")
        
        return True
    
    def is_nonce_used(self, nonce: str) -> bool:
        """Check if a nonce has already been used"""
        return nonce in self.used_nonces
