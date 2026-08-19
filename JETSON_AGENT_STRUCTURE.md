# TFrenzy Jetson Agent - Project Structure Guide

## Complete Directory Layout

```
tfrenzy-modelguard/
│
├── jetson-agent/                          # Secure Jetson Agent Implementation
│   │
│   ├── src/
│   │   ├── __init__.py
│   │   │
│   │   ├── main.py                        # ENTRY POINT: Agent daemon launcher
│   │   │   └─ Initializes configuration, creates agent, runs main loop
│   │   │   └─ Handles signals (SIGTERM, SIGINT) for graceful shutdown
│   │   │   └─ Logging setup and error handling
│   │   │
│   │   ├── config.py                      # CONFIGURATION LOADER
│   │   │   └─ AgentConfig dataclass with environment variable loading
│   │   │   └─ Loads from TFRENZY_* env vars
│   │   │   └─ Defaults for all settings (backend URL, timeouts, etc.)
│   │   │
│   │   ├── agent.py                       # MAIN ORCHESTRATOR (12-STEP WORKFLOW)
│   │   │   └─ SecureJetsonAgent class
│   │   │   └─ Implements secure activation and deployment pipeline:
│   │   │   │   1. Device authentication via proof-of-possession
│   │   │   │   2. Status reporting (online)
│   │   │   │   3. Deployment retrieval
│   │   │   │   4. Deployment status and expiration validation
│   │   │   │   5. Encrypted package retrieval
│   │   │   │   6. Digital signature verification (RSA-3072-PSS)
│   │   │   │   7. Package hash integrity check (SHA-256)
│   │   │   │   8. Single-use nonce generation and atomic consumption
│   │   │   │   9. Key release authorization request
│   │   │   │   10. In-memory AES-256-GCM decryption
│   │   │   │   11. TensorRT engine check (runtime dependent)
│   │   │   │   12. Secure multi-pass memory zeroing
│   │   │   └─ Coordinates background license renewal service and steady-state loop
│   │   │
│   │   ├── crypto/                        # CRYPTOGRAPHIC OPERATIONS
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── mtls.py                    # mTLS & DEVICE IDENTITIES
│   │   │   │   ├─ CertificateManager:
│   │   │   │   │   ├─ load_certificate()
│   │   │   │   │   ├─ save_certificate()
│   │   │   │   │   ├─ get_certificate_fingerprint()  # Standard DER SHA-256 colon-separated hex
│   │   │   │   │   ├─ verify_certificate_validity()  # Dates, RSA key size, CA chain
│   │   │   │   │   ├─ sign_challenge()               # RSA-3072-PSS challenge signature
│   │   │   │   │   └─ extract_device_identity()
│   │   │   │   └─ MTLSClient:
│   │   │   │       ├─ initialize()
│   │   │   │       ├─ get_client_cert_key_pair()
│   │   │   │       └─ get_ca_cert_path()
│   │   │   │
│   │   │   ├── encryption.py              # AES-256-GCM ENCRYPTION/DECRYPTION
│   │   │   │   ├─ EncryptionManager:
│   │   │   │   │   ├─ decrypt_aes256_gcm()       # Decrypt model in-memory
│   │   │   │   │   └─ encrypt_aes256_gcm()       # Test helper
│   │   │   │   └─ Uses cryptography.hazmat.primitives.ciphers.aead.AESGCM
│   │   │   │
│   │   │   ├── verification.py            # SIGNATURE & HASH VERIFICATION
│   │   │   │   └─ PackageVerifier:
│   │   │   │       ├─ verify_signature()      # Verify RSA-3072-PSS over manifest
│   │   │   │       └─ verify_hash()           # Verify SHA-256 of encrypted package
│   │   │   │
│   │   │   └── nonce.py                   # NONCE MANAGEMENT (REPLAY PREVENTION)
│   │   │       └─ NonceManager:
│   │   │           ├─ generate_nonce()        # Generate TF-NONCE-{rand}-{timestamp}
│   │   │           ├─ record_nonce()          # Track used nonces
│   │   │           └─ is_nonce_used()         # Check for duplicate nonces
│   │   │
│   │   ├── api/                           # BACKEND API COMMUNICATION
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   └── client.py                  # BACKEND API CLIENT WITH mTLS
│   │   │       └─ BackendAPIClient:
│   │   │           ├─ initialize()                  # Configure TLS/mTLS session
│   │   │           ├─ authenticate_device()        # POST /api/auth/device-challenge + verify
│   │   │           ├─ get_deployment()             # GET /api/deployments/device/{id}
│   │   │           ├─ get_model_package()          # GET /api/models/{id}/packages/{ver}
│   │   │           ├─ consume_nonce()              # POST /api/security/consume-nonce
│   │   │           ├─ request_key_release()        # POST /api/security/key-release
│   │   │           ├─ renew_activation_license()   # POST /api/licenses/renew
│   │   │           ├─ report_status()              # POST /api/devices/{id}/status
│   │   │           └─ close()                      # Cleanup
│   │   │
│   │   ├── runtime/                       # RUNTIME & MEMORY
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   └── memory.py                  # SECURE MEMORY MANAGEMENT
│   │   │       ├─ MemoryBuffer: dataclass for allocated buffers
│   │   │       └─ MemoryManager:
│   │   │           ├─ allocate_buffer()       # Allocate memory buffer
│   │   │           ├─ zero_buffer()           # Secure multi-pass wipe (0x00 -> 0x55AA -> 0x00)
│   │   │           └─ flush_all_buffers()
│   │   │
│   │   ├── background/                    # BACKGROUND SERVICES
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   └── license_renewal.py         # LICENSE RENEWAL SERVICE
│   │   │       └─ LicenseRenewalService:
│   │   │           ├─ run()                   # Main renewal loop (every 12 hours)
│   │   │           ├─ _perform_renewal()      # Call backend to renew license
│   │   │           └─ stop()                  # Graceful shutdown
│   │   │
│   │   └── utils/                         # UTILITIES
│   │       ├── __init__.py
│   │       │
│   │       └── logger.py                  # STRUCTURED LOGGING
│   │           └─ setup_logger()              # Console + file logging
│   │
│   ├── config/                            # DEVICE CERTIFICATES & KEYS
│   │   ├── device.cert.pem                # Device X.509 certificate
│   │   ├── device.key.pem                 # Device RSA private key
│   │   └── ca.crt                         # CA certificate for verification
│   │
│   ├── tests/                             # AUTOMATED TEST SUITE (25 TESTS)
│   │   ├── __init__.py
│   │   ├── test_agent_security.py         # 18-gate security & acceptance tests
│   │   └── test_verification.py           # RSA-3072-PSS signature verification tests
│   │
│   ├── requirements.txt                   # Python dependencies
│   ├── README.md                          # Full agent documentation
│   ├── .env.example                       # Environment variable template
│   └── example_run.py                     # Quick start example
│
├── keys/                                  # PLATFORM KEYS
│   ├── modelguard-private.pem             # Root RSA-3072 private signing key
│   └── modelguard-public.pem              # Root RSA-3072 public signing key
│
├── src/                                   # FRONTEND REACT APPLICATION
│   ├── components/                        # UI components & modals
│   ├── pages/                             # Dashboard, Models, Devices, Deployments, AttackLab
│   └── db/database.ts                     # PostgreSQL database connection pool
│
└── server.ts                              # EXPRESS BACKEND & VITE SSR SERVER
```

---

## 🔐 Cryptographic Implementation Highlights

1. **Authentication**: Device private-key based RSA-3072-PSS proof-of-possession authentication.
2. **Hardware Identity**: Prototype hardware identity hash derived from device serial number and MAC address. This is not NVIDIA silicon-fuse attestation.
3. **Runtime & TensorRT Execution**: The secure agent implements the authorization and in-memory decryption pipeline. TensorRT execution is environment-dependent and requires the Jetson/CUDA/TensorRT runtime.
4. **Disk Hygiene**: The agent is designed to decrypt the model in memory and does not intentionally write the decrypted `.engine` file to disk.

---

## 🧪 Testing

Run the full automated test suite:
```bash
python -m pytest jetson-agent/tests -v
```
All 25 automated Python unit and security tests pass.
