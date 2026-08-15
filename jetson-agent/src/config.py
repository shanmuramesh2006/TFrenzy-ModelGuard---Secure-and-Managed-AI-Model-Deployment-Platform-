"""
Configuration management for TFrenzy Jetson Agent
Loads settings from environment variables and config files
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class AgentConfig:
    """Agent configuration"""
    
    # Backend API (required)
    backend_url: str
    
    # Device identity (required)
    device_id: str
    device_cert_path: str
    device_key_path: str
    ca_cert_path: str
    
    # Backend API (optional with defaults)
    api_timeout: int = 30
    
    # Deployment (optional with defaults)
    deployment_id: Optional[str] = None
    model_cache_dir: str = "/tmp/tfrenzy-models"
    
    # TensorRT
    trt_enabled: bool = True
    cuda_device: int = 0
    
    # Security
    max_offline_days: int = 7
    license_renewal_interval_hours: int = 12
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "/var/log/tfrenzy-agent.log"
    
    # Feature flags
    enable_memory_encryption: bool = True
    enable_performance_monitoring: bool = True
    
    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Load configuration from environment variables"""
        backend_url = os.getenv("TFRENZY_BACKEND_URL", "http://localhost:5000")
        device_id = os.getenv("TFRENZY_DEVICE_ID")
        deployment_id = os.getenv("TFRENZY_DEPLOYMENT_ID")
        
        if not device_id:
            raise ValueError("TFRENZY_DEVICE_ID environment variable not set")
        
        config_dir = Path(os.getenv("TFRENZY_CONFIG_DIR", "/etc/tfrenzy"))
        
        return cls(
            backend_url=backend_url,
            api_timeout=int(os.getenv("TFRENZY_API_TIMEOUT", "30")),
            device_id=device_id,
            device_cert_path=str(config_dir / "device.cert.pem"),
            device_key_path=str(config_dir / "device.key.pem"),
            ca_cert_path=str(config_dir / "ca.crt"),
            deployment_id=deployment_id,
            model_cache_dir=os.getenv("TFRENZY_MODEL_CACHE", "/tmp/tfrenzy-models"),
            trt_enabled=os.getenv("TFRENZY_TRT_ENABLED", "true").lower() == "true",
            cuda_device=int(os.getenv("TFRENZY_CUDA_DEVICE", "0")),
            max_offline_days=int(os.getenv("TFRENZY_MAX_OFFLINE_DAYS", "7")),
            license_renewal_interval_hours=int(os.getenv("TFRENZY_LICENSE_RENEWAL_HOURS", "12")),
            log_level=os.getenv("TFRENZY_LOG_LEVEL", "INFO"),
            log_file=os.getenv("TFRENZY_LOG_FILE", "/var/log/tfrenzy-agent.log"),
            enable_memory_encryption=os.getenv("TFRENZY_MEMORY_ENCRYPTION", "true").lower() == "true",
            enable_performance_monitoring=os.getenv("TFRENZY_PERFORMANCE_MONITORING", "true").lower() == "true",
        )
