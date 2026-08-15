"""
Encryption and Decryption Operations
Handles AES-256-GCM decryption of model packages
"""

import logging
import os
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
import binascii

logger = logging.getLogger(__name__)


class EncryptionManager:
    """Manages cryptographic decryption operations"""
    
    async def decrypt_aes256_gcm(self, encrypted_data: bytes, key: str, 
                                  iv: str, auth_tag: str) -> bytes:
        """
        Decrypt data using AES-256-GCM
        
        Args:
            encrypted_data: The encrypted model file
            key: Hex-encoded encryption key (256-bit)
            iv: Hex-encoded initialization vector (96-bit)
            auth_tag: Hex-encoded authentication tag (128-bit)
        
        Returns:
            Decrypted plaintext model data
        """
        try:
            logger.info("Starting AES-256-GCM decryption...")
            
            # Convert hex strings to bytes
            key_bytes = binascii.unhexlify(key)
            iv_bytes = binascii.unhexlify(iv)
            tag_bytes = binascii.unhexlify(auth_tag)
            
            # Verify key size (256 bits = 32 bytes)
            if len(key_bytes) != 32:
                raise ValueError(f"Invalid key size: {len(key_bytes)} bytes, expected 32")
            
            # Verify IV size (96 bits = 12 bytes)
            if len(iv_bytes) != 12:
                raise ValueError(f"Invalid IV size: {len(iv_bytes)} bytes, expected 12")
            
            # Verify auth tag size (128 bits = 16 bytes)
            if len(tag_bytes) != 16:
                raise ValueError(f"Invalid auth tag size: {len(tag_bytes)} bytes, expected 16")
            
            # Create cipher
            cipher = AESGCM(key_bytes)
            
            # Decrypt: ciphertext is encrypted_data || auth_tag
            # GCM requires appending the tag to the ciphertext
            ciphertext_with_tag = encrypted_data + tag_bytes
            
            plaintext = cipher.decrypt(iv_bytes, ciphertext_with_tag, None)
            
            logger.info(f"✓ AES-256-GCM decryption successful")
            logger.info(f"  Decrypted size: {len(plaintext)} bytes")
            
            return plaintext
            
        except Exception as e:
            logger.error(f"✗ AES-256-GCM decryption failed: {e}")
            raise
    
    async def encrypt_aes256_gcm(self, plaintext: bytes, key: str = None) -> Tuple[bytes, str, str, str]:
        """
        Encrypt data using AES-256-GCM
        Used for testing/development
        
        Args:
            plaintext: Data to encrypt
            key: Optional pre-generated hex key
        
        Returns:
            Tuple of (ciphertext, key_hex, iv_hex, tag_hex)
        """
        try:
            # Generate or use provided key
            if key:
                key_bytes = binascii.unhexlify(key)
            else:
                key_bytes = os.urandom(32)  # 256-bit key
            
            # Generate random IV (96-bit is recommended for GCM)
            iv_bytes = os.urandom(12)
            
            # Create cipher
            cipher = AESGCM(key_bytes)
            
            # Encrypt
            ciphertext = cipher.encrypt(iv_bytes, plaintext, None)
            
            # Split ciphertext and tag
            # In GCM, tag is the last 16 bytes
            encrypted_data = ciphertext[:-16]
            tag = ciphertext[-16:]
            
            # Convert to hex
            key_hex = binascii.hexlify(key_bytes).decode()
            iv_hex = binascii.hexlify(iv_bytes).decode()
            tag_hex = binascii.hexlify(tag).decode()
            
            return encrypted_data, key_hex, iv_hex, tag_hex
            
        except Exception as e:
            logger.error(f"AES-256-GCM encryption failed: {e}")
            raise
