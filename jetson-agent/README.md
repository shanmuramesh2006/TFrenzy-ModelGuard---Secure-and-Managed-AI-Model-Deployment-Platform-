# TFrenzy Secure Jetson Agent

A Python agent for secure model deployment on NVIDIA Jetson devices, implementing the two-level activation and protected model deployment workflow for the TFrenzy ModelGuard platform.

## Features

### 1. Device Authentication & mTLS
- Device private-key based RSA-3072-PSS proof-of-possession authentication.
- Prototype hardware identity hash derived from device serial number and MAC address. This is not NVIDIA silicon-fuse attestation.
- Mutual TLS (mTLS) session configuration with certificate validity and CA trust chain verification.
- Standard X.509 DER SHA-256 fingerprinting.

### 2. Secure Model Deployment Pipeline
- Retrieve active deployment details from backend via REST API.
- Download encrypted model packages (`.engine` payloads).
- Verify digital signatures (RSA-3072-PSS over manifest with 32-byte salt).
- Verify package integrity (SHA-256 hash over ciphertext).

### 3. Two-Level Activation & Replay Protection
- Cryptographic challenge-response authentication with 60-second TTL.
- Multi-gate backend key release authorization.
- Short-lived activation license distribution (24 hours).
- Single-use nonce generation and atomic database consumption preventing replay attacks.

### 4. In-Memory Decryption & Memory Hygiene
- Temporary AES-256-GCM decryption key release from server memory.
- Decrypt model directly into memory buffers.
- The agent is designed to decrypt the model in memory and does not intentionally write the decrypted `.engine` file to disk.
- Multi-pass secure memory zeroing (zeros → alternating pattern 0x55AA → zeros) after engine loading or shutdown.

### 5. Runtime & Inference
- The secure agent implements the authorization and in-memory decryption pipeline. TensorRT execution is environment-dependent and requires the Jetson/CUDA/TensorRT runtime.
- On environments without TensorRT / CUDA, executes in verified host protection mode.

### 6. Background Services
- Periodic background license renewal service (`LicenseRenewalService`, default 12-hour interval).
- Device heartbeat and status reporting.
- Graceful shutdown with automatic memory buffer flushing.

---

## Installation & Setup

### Prerequisites
- Python 3.8+
- NVIDIA Jetson Orin Nano (or compatible Jetson / Linux environment)
- TensorRT 8.5+ & CUDA 11.x (for physical GPU inference on Jetson hardware)

### Setup

```bash
cd jetson-agent

# Create virtual environment
python -m venv venv
# On Linux / Jetson:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## Configuration

Environment variables can be defined in `.env` or set directly:

```bash
# Backend API
export TFRENZY_BACKEND_URL="http://localhost:5000"
export TFRENZY_API_TIMEOUT=30

# Device Identity
export TFRENZY_DEVICE_ID="DEV-JETSON-ORIN-001"
export TFRENZY_CONFIG_DIR="./certs"

# Security & Licensing
export TFRENZY_LICENSE_RENEWAL_HOURS="12"
export TFRENZY_MEMORY_ENCRYPTION="true"
```

---

## Running the Agent

```bash
# Run agent in standalone daemon mode
python src/main.py
```

---

## 🧪 Testing

Run the automated test suite:
```bash
python -m pytest tests/ -v
```

25 automated Python unit and security tests pass:
- X.509 certificate expiry, malformed PEM, valid acceptance, wrong CA rejection, DER SHA-256 fingerprint verification.
- Wrong device rejection, challenge replay rejection, expired challenge rejection.
- Duplicate nonce rejection, wrong package hash rejection, invalid RSA signature rejection, modified manifest rejection.
- Unauthorized key release rejection, expired deployment rejection, expired license rejection, revoked device rejection, revoked deployment rejection.
- In-memory AES-256-GCM decryption and secure memory zeroing.
- Plaintext disk hygiene verification test.
