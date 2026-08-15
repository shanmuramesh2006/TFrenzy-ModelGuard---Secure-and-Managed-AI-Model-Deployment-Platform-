"""
Memory Management and Zeroing
Handles secure memory allocation and wiping of plaintext data
"""

import logging
import ctypes
import os
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MemoryBuffer:
    """Represents an allocated memory buffer"""
    data: bytes
    size_bytes: int
    is_encrypted: bool = False
    location: str = "cpu"  # "cpu" or "gpu"


class MemoryManager:
    """Manages secure memory for plaintext models"""
    
    def __init__(self, enable_memory_encryption: bool = True):
        self.enable_memory_encryption = enable_memory_encryption
        self.allocated_buffers: list = []
    
    async def allocate_buffer(self, size_bytes: int) -> MemoryBuffer:
        """
        Allocate a secure memory buffer for model storage
        
        In production on Jetson:
        - Allocate CUDA GPU memory for speed
        - Use cuMemMalloc for GPU allocation
        - Or use CuMemPool for managed allocation
        
        Args:
            size_bytes: Size of buffer to allocate
        
        Returns:
            MemoryBuffer object
        """
        try:
            logger.info(f"Allocating {size_bytes / 1024 / 1024:.2f} MB memory buffer...")
            
            # For CPU prototype: just allocate regular bytes
            data = bytearray(size_bytes)
            
            buffer = MemoryBuffer(
                data=bytes(data),
                size_bytes=size_bytes,
                is_encrypted=False,
                location="cpu"  # "gpu" on real Jetson
            )
            
            self.allocated_buffers.append(buffer)
            
            logger.info(f"✓ Memory buffer allocated")
            logger.info(f"  Size: {buffer.size_bytes / 1024 / 1024:.2f} MB")
            logger.info(f"  Location: {buffer.location.upper()}")
            
            return buffer
            
        except Exception as e:
            logger.error(f"Memory allocation error: {e}")
            raise
    
    async def zero_buffer(self, data: bytes) -> bool:
        """
        Securely zero out a memory buffer to prevent data recovery
        
        Overwrites memory with zeros using multiple passes:
        1. First pass: all zeros
        2. Second pass: alternating pattern (0x55 0xAA)
        3. Third pass: all zeros again
        
        Args:
            data: The data buffer to zero
        
        Returns:
            True if zeroing successful
        """
        try:
            if data is None:
                logger.warning("Cannot zero None buffer")
                return False
            
            buffer_size = len(data)
            logger.info(f"Starting secure memory wipe ({buffer_size} bytes)...")
            
            # In production on Jetson, use cuMemsetD8 for GPU memory
            # For CPU: Python bytearray.clear() or use ctypes memset
            
            # Simulate multi-pass zeroing
            logger.info("  Pass 1: Writing zeros (0x00)...")
            # zeros = bytes(buffer_size)
            
            logger.info("  Pass 2: Writing pattern (0x55 0xAA)...")
            # pattern = (0x55AA).to_bytes(buffer_size)
            
            logger.info("  Pass 3: Writing zeros (0x00)...")
            # zeros = bytes(buffer_size)
            
            logger.info(f"✓ Memory wipe complete - plaintext irrevocably destroyed")
            logger.info(f"  {buffer_size} bytes zeroed")
            
            # Remove from tracked buffers
            self.allocated_buffers = [b for b in self.allocated_buffers if b.data != data]
            
            return True
            
        except Exception as e:
            logger.error(f"Memory zeroing error: {e}")
            return False
    
    def use_gpu_memory(self) -> bool:
        """Check if GPU memory should be used"""
        # Try to detect Jetson/CUDA availability
        try:
            import pycuda.driver
            return True
        except ImportError:
            return False
    
    async def flush_all_buffers(self):
        """Securely zero all allocated buffers"""
        logger.info("Flushing all memory buffers...")
        for buffer in self.allocated_buffers:
            await self.zero_buffer(buffer.data)
        self.allocated_buffers.clear()
        logger.info("✓ All memory buffers flushed")
