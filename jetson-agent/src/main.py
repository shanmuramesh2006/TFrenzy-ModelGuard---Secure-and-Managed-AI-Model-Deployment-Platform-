"""
TFrenzy Secure Jetson Agent - Main Entry Point
Runs as a system daemon on Jetson Orin Nano
Performs device authentication, model deployment, and secure inference
"""

import asyncio
import logging
import os
from pathlib import Path
import signal
import sys

from config import AgentConfig
from agent import SecureJetsonAgent
from utils.logger import setup_logger

logger = logging.getLogger(__name__)


class AgentDaemon:
    """Main daemon manager for the Jetson agent"""
    
    def __init__(self):
        self.agent = None
        self.running = False
        
    async def start(self):
        """Start the agent daemon"""
        logger.info("=" * 80)
        logger.info("TFrenzy Secure Jetson Agent v2.1.0")
        logger.info("Starting on Jetson Orin Nano...")
        logger.info("=" * 80)
        
        try:
            config = AgentConfig.from_env()
            self.agent = SecureJetsonAgent(config)
            
            self.running = True
            
            # Run agent main loop
            await self.agent.run()
            
        except KeyboardInterrupt:
            logger.info("\nShutdown signal received")
            self.running = False
        except Exception as e:
            logger.error(f"Fatal error in agent: {e}", exc_info=True)
            sys.exit(1)
        finally:
            if self.agent:
                await self.agent.shutdown()
                
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down...")
        self.running = False


def main():
    """Entry point for the agent"""
    # Setup logging
    setup_logger()
    
    # Create daemon
    daemon = AgentDaemon()
    
    # Register signal handlers
    signal.signal(signal.SIGINT, daemon.signal_handler)
    signal.signal(signal.SIGTERM, daemon.signal_handler)
    
    # Run daemon
    try:
        asyncio.run(daemon.start())
    except KeyboardInterrupt:
        logger.info("Agent stopped")
        sys.exit(0)


if __name__ == "__main__":
    main()
