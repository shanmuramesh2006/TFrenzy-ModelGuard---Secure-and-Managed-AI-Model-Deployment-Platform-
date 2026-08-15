"""
Logger Configuration
Sets up structured logging for the agent
"""

import logging
import sys
from pathlib import Path


def setup_logger(log_level: str = "INFO", log_file: str = None):
    """
    Configure structured logging
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file to log to
    """
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level))
    
    # Console handler (always)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))
    
    # Format: [TIMESTAMP] [LEVEL] [MODULE] Message
    formatter = logging.Formatter(
        fmt='[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        try:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            file_handler = logging.FileHandler(log_path)
            file_handler.setLevel(getattr(logging, log_level))
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
            
            logger.debug(f"Logging to file: {log_path}")
        except Exception as e:
            logger.warning(f"Failed to setup file logging: {e}")
