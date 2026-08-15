"""
Example: Running TFrenzy Agent Against Real Backend

This script demonstrates how to:
1. Set up device certificates via mTLS
2. Authenticate with backend
3. Retrieve and decrypt a model
4. Start inference
"""

import asyncio
import os
import sys
import json
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from config import AgentConfig
from agent import SecureJetsonAgent


async def main():
    """Run the agent example"""
    
    print("\n" + "="*80)
    print("TFrenzy Jetson Agent - Quick Start Example")
    print("="*80)
    print()
    
    # Step 1: Load configuration
    print("1. Loading configuration from environment...")
    try:
        config = AgentConfig.from_env()
        print(f"   ✓ Device ID: {config.device_id}")
        print(f"   ✓ Backend: {config.backend_url}")
        print(f"   ✓ Config dir: {config.device_cert_path}")
    except ValueError as e:
        print(f"   ✗ Configuration error: {e}")
        print()
        print("Please set TFRENZY_DEVICE_ID environment variable:")
        print("  export TFRENZY_DEVICE_ID='DEV-JETSON-ORIN-001'")
        return
    
    # Step 2: Create agent
    print()
    print("2. Creating Secure Jetson Agent...")
    agent = SecureJetsonAgent(config)
    print("   ✓ Agent created")
    
    # Step 3: Run agent
    print()
    print("3. Starting 14-step activation workflow...\n")
    
    try:
        await agent.run()
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        await agent.shutdown()


if __name__ == "__main__":
    # Quick test: check environment
    print("\nEnvironment Check:")
    print(f"  TFRENZY_DEVICE_ID: {os.getenv('TFRENZY_DEVICE_ID', '(not set)')}")
    print(f"  TFRENZY_BACKEND_URL: {os.getenv('TFRENZY_BACKEND_URL', 'localhost:5000')}")
    print(f"  TFRENZY_CONFIG_DIR: {os.getenv('TFRENZY_CONFIG_DIR', '/etc/tfrenzy')}")
    print()
    
    # Run agent
    asyncio.run(main())
