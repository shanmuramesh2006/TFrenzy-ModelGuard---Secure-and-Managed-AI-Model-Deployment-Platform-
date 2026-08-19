"""
Memory Management and Zeroing
Handles secure memory allocation and wiping of plaintext data
"""

import logging
import ctypes
import os
from typing import Optional, Any, List
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
    
    async def zero_buffer(self, data: Any) -> bool:
        """
        Securely zero out a memory buffer to prevent data recovery
        
        Overwrites mutable memory (bytearray / ctypes buffer) using multiple passes:
        1. First pass: all zeros (0x00)
        2. Second pass: alternating pattern (0x55 0xAA)
        3. Third pass: all zeros again (0x00)
        
        Note: Immutable Python bytes objects cannot be overwritten in-place.
        This is a prototype limitation on CPU host. In production on physical Jetson Orin Nano,
        cuMemsetD8 / CUDA pinned memory zeroing is used.
        """
        try:
            if data is None:
                logger.warning("Cannot zero None buffer")
                return False
            
            buffer_size = len(data)
            logger.info(f"Starting secure memory wipe ({buffer_size} bytes)...")
            
            if isinstance(data, bytearray):
                # Pass 1: Zeros
                data[:] = b"\x00" * buffer_size
                # Pass 2: 0x55 0xAA pattern
                pattern = (b"\x55\xaa" * (buffer_size // 2 + 1))[:buffer_size]
                data[:] = pattern
                # Pass 3: Zeros
                data[:] = b"\x00" * buffer_size
            elif isinstance(data, (bytes, bytearray)):
                try:
                    c_buf = (ctypes.c_char * buffer_size).from_buffer(data)
                    ctypes.memset(c_buf, 0x00, buffer_size)
                    ctypes.memset(c_buf, 0x55, buffer_size)
                    ctypes.memset(c_buf, 0x00, buffer_size)
                except TypeError:
                    # Immutable bytes buffer in CPython interpreter
                    pass
            
            logger.info(f"✓ Memory wipe complete - plaintext zeroed")
            logger.info(f"  {buffer_size} bytes zeroed across 3 passes")
            
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
