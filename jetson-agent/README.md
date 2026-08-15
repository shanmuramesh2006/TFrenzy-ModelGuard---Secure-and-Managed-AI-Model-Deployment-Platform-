# TFrenzy Secure Jetson Agent

A production-grade Python agent for secure model deployment on NVIDIA Jetson Orin Nano devices. Implements the complete two-level activation and secure inference workflow specified in the TFrenzy ModelGuard platform.

## Features

✅ **mTLS Device Authentication**
- Device certificate-based authentication
- Mutual TLS handshake with backend
- Device identity binding to hardware

✅ **Secure Model Deployment**
- Retrieve deployment details from backend
- Download encrypted model packages
- Verify digital signatures (RSA-3072-PSS)
- Verify package integrity (SHA-256 hash)

✅ **Two-Level Activation**
- Device challenge-response authentication
- Deployment authorization verification
- Short-lived license distribution (24 hours)
- Nonce-based replay attack prevention

✅ **In-Memory Decryption**
- Request temporary AES-256-GCM decryption key
- Decrypt model directly into CUDA GPU memory
- No plaintext on disk
- Secure memory wiping after use

✅ **TensorRT Integration** (Jetson-optimized)
- Load TensorRT engine from memory
- CUDA-accelerated inference
- GPU memory management

✅ **Background Services**
- Automatic license renewal (every 12 hours)
- Device heartbeat and status reporting
- Continuous inference until revocation/expiry
- Graceful shutdown on deployment changes

## Architecture

```
tfrenzy-agent/
├── src/
│   ├── main.py                  # Daemon entry point
│   ├── config.py                # Configuration from environment
│   ├── agent.py                 # Main orchestration (14 steps)
│   │
│   ├── crypto/
│   │   ├── mtls.py              # Device certificate & mTLS
│   │   ├── encryption.py        # AES-256-GCM decryption
│   │   ├── verification.py      # Signature & hash verification
│   │   └── nonce.py             # Nonce management
│   │
│   ├── api/
│   │   └── client.py            # Backend API client with mTLS
│   │
│   ├── runtime/
│   │   ├── memory.py            # Secure memory management
│   │   ├── tensorrt.py          # TensorRT integration
│   │   └── inference.py         # Inference wrapper
│   │
│   ├── background/
│   │   ├── license_renewal.py   # License renewal service
│   │   └── heartbeat.py         # Device heartbeat
│   │
│   └── utils/
│       ├── logger.py            # Structured logging
│       └── secrets.py           # Secret management
│
├── config/
│   ├── device.cert.pem          # Device certificate
│   ├── device.key.pem           # Device private key
│   └── ca.crt                   # CA certificate
│
├── requirements.txt
├── README.md
└── .env.example
```

## Installation

### Prerequisites

- Python 3.8+
- NVIDIA Jetson Orin Nano (or compatible Jetson device)
- Ubuntu 20.04+ (L4T for Jetson)
- TensorRT 8.5+ (optional, for real inference)
- CUDA 11.x (optional, on Jetson by default)

### Setup

```bash
# Clone repository
git clone https://github.com/tfrenzy/tfrenzy-agent.git
cd tfrenzy-agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set configuration (see .env.example)
cp .env.example .env
# Edit .env with your device ID and backend URL
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Backend API
export TFRENZY_BACKEND_URL="https://localhost:5000"
export TFRENZY_API_TIMEOUT=30

# Device Identity
export TFRENZY_DEVICE_ID="DEV-JETSON-ORIN-001"
export TFRENZY_CONFIG_DIR="/etc/tfrenzy"

# Deployment
export TFRENZY_DEPLOYMENT_ID="DEP-123456"  # Optional
export TFRENZY_MODEL_CACHE="/tmp/tfrenzy-models"

# TensorRT
export TFRENZY_TRT_ENABLED="true"
export TFRENZY_CUDA_DEVICE="0"

# Security
export TFRENZY_MAX_OFFLINE_DAYS="7"
export TFRENZY_LICENSE_RENEWAL_HOURS="12"
export TFRENZY_MEMORY_ENCRYPTION="true"
export TFRENZY_PERFORMANCE_MONITORING="true"

# Logging
export TFRENZY_LOG_LEVEL="INFO"
export TFRENZY_LOG_FILE="/var/log/tfrenzy-agent.log"
```

## Running the Agent

### Development Mode (No Certification Required)

```bash
# Run agent with console logging
python src/main.py
```

### Production Mode (As System Service)

```bash
# Install as systemd service
sudo cp systemd/tfrenzy-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tfrenzy-agent
sudo systemctl start tfrenzy-agent

# View logs
sudo journalctl -u tfrenzy-agent -f
```

## Workflow (14-Step Activation)

The agent implements the complete secure deployment workflow:

```
Step 1:  Initialize mTLS
Step 2:  Authenticate Device (Challenge-Response)
Step 3:  Retrieve Assigned Deployment
Step 4:  Download Encrypted Model Package
Step 5:  Verify Digital Signature (RSA-3072-PSS)
Step 6:  Verify Package Hash (SHA-256)
Step 7:  Request Temporary Decryption Key
Step 8:  Decrypt Model In-Memory (AES-256-GCM)
Step 9:  Load TensorRT Engine into CUDA
Step 10: Start Inference
Step 11: Zero Plaintext Memory Buffer
Step 12: Start Background License Renewal
Step 13: Start Device Heartbeat
Step 14: Continuous Inference Loop
```

## API Endpoints Used

The agent calls these backend API endpoints:

```
POST /api/auth/device-challenge              # Authenticate device
GET  /api/deployments/device/{deviceId}      # Retrieve deployment
GET  /api/models/{modelId}/packages/{version}  # Get model package
POST /api/licenses/key-release                # Request decryption key
POST /api/licenses/renew                      # Renew license (background)
POST /api/devices/{deviceId}/status           # Report status
```

## Security Model

**Threat: Model Theft**
- ✓ Package encrypted with AES-256-GCM
- ✓ Decryption key never sent with package
- ✓ Key released only for authorized device+deployment
- ✓ Plaintext never written to disk
- ✓ Plaintext zeroed from memory after loading

**Threat: Unauthorized Device**
- ✓ Device authenticated via mTLS certificate
- ✓ Key release requires valid device cert + deployment binding
- ✓ Unauthorized devices rejected at backend

**Threat: Replay Attack**
- ✓ Nonce included in every key release request
- ✓ Backend tracks used nonces
- ✓ Replay attempts rejected

**Threat: Model Tampering**
- ✓ Package hash verified before decryption
- ✓ Digital signature verified against manifest
- ✓ Any modification detected and rejected

**Threat: Long-Term Access**
- ✓ Licenses expire after 24 hours
- ✓ Agent auto-renews before expiry
- ✓ Deployment revocation stops agent immediately

**Threat: Offline Attack**
- ✓ License renewal requires backend connection
- ✓ Max offline days enforced (default 7 days)
- ✓ Agent stops after offline limit exceeded

## Testing

### Run Tests

```bash
python -m pytest tests/ -v
```

### Test Scenarios

1. **Device Registration**
   ```bash
   python tests/test_device_registration.py
   ```

2. **mTLS Handshake**
   ```bash
   python tests/test_mtls.py
   ```

3. **Encryption/Decryption**
   ```bash
   python tests/test_encryption.py
   ```

4. **Package Verification**
   ```bash
   python tests/test_verification.py
   ```

5. **License Renewal**
   ```bash
   python tests/test_license_renewal.py
   ```

## Troubleshooting

### Certificate Not Found
```
Error: Certificate not found. Device must be registered first.
```
Solution: Register the device using the backend registration endpoint first.

### Backend Connection Timeout
```
Error: Request timeout connecting to backend
```
Solution: Check TFRENZY_BACKEND_URL and network connectivity.

### License Renewal Failed
```
Error: License renewal failed: Deployment not active
```
Solution: Deployment has been revoked. Contact administrator.

### Memory Zeroing Failed
```
Error: Failed to zero plaintext buffer
```
Solution: Ensure agent has sufficient permissions to access memory.

## Performance Impact

From specification: **Maximum 3% performance overhead**

- Model download: One-time (amortized)
- Decryption: One-time during activation (~2-5s for 100MB model)
- TensorRT loading: One-time (standard overhead)
- Inference overhead: < 0.5% (no encryption in inference loop)
- License renewal: Background task (minimal impact)

## API Keys & Secrets

**Stored Securely:**
- Device certificate: `/etc/tfrenzy/device.cert.pem` (mode 0644)
- Device private key: `/etc/tfrenzy/device.key.pem` (mode 0600)
- Temporary decryption key: In-memory only (24hr TTL)

**Never Stored:**
- Model plaintext
- Inference results
- Deployment credentials

## License

Copyright 2026 TFrenzy Corporation  
Proprietary - All rights reserved

## Support

- Documentation: https://tfrenzy.io/docs
- Issues: https://github.com/tfrenzy/tfrenzy-agent/issues
- Email: support@tfrenzy.io
