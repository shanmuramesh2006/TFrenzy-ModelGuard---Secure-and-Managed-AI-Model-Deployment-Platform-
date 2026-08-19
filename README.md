# TFrenzy ModelGuard - Secure AI Model Deployment Platform

TFrenzy ModelGuard is a secure and managed AI model deployment platform designed for edge devices such as NVIDIA Jetson Orin Nano. It provides end-to-end cryptographic protection, two-level activation, device authorization, replay attack prevention, and in-memory model decryption.

---

## 🔐 Core Security Capabilities

1. **Model Packaging & Encryption**: Authenticated AES-256-GCM encryption with 256-bit keys, 96-bit IVs, and 128-bit authentication tags.
2. **Package Digital Signatures**: RSA-3072-PSS digital signatures with SHA-256 and 32-byte salt over package manifests.
3. **Package Integrity**: SHA-256 hash validation ensuring tampered model payloads are rejected before decryption.
4. **Device Authentication**: Device private-key based RSA-3072-PSS proof-of-possession authentication.
5. **Hardware Identity**: Prototype hardware identity hash derived from device serial number and MAC address. This is not NVIDIA silicon-fuse attestation.
6. **Replay Protection**: Single-use cryptographic challenges and nonces consumed atomically with transactional locking.
7. **Key Release Authorization**: Multi-gate server-side authorization ensuring only active, unexpired, assigned, and unrevoked deployments receive decryption key material.
8. **Plaintext Protection**: The agent is designed to decrypt the model in memory and does not intentionally write the decrypted `.engine` file to disk.
9. **Memory Hygiene**: Multi-pass secure wiping (zeros → alternating bit pattern 0x55AA → zeros) of sensitive buffers upon completion.
10. **Runtime Execution**: The secure agent implements the authorization and in-memory decryption pipeline. TensorRT execution is environment-dependent and requires the Jetson/CUDA/TensorRT runtime.
11. **Background Licensing**: Asynchronous background license renewal service maintaining continuous verification against the central authority.

---

## 📁 Repository Structure

- `jetson-agent/`: Python edge agent daemon implementing the 12-step secure activation pipeline, cryptographic routines, and background renewal service.
- `src/`: React frontend dashboard featuring Models, Devices, Deployments, and Attack Lab security tests.
- `server.ts`: Express backend and API server with PostgreSQL integration, certificate handling, and key release logic.
- `keys/`: Platform RSA-3072 root signing keypair for package and license signing.

---

## 🧪 Testing & Verification

### Run Python Automated Tests (25 Tests)
```bash
python -m pytest jetson-agent/tests -v
```

### Run Frontend Typecheck & Build
```bash
npm run lint
npm run build
```

---

## 📊 Recorded Performance Benchmarks

- **Direct TensorRT (Unprotected)**: 142.5 FPS | 7.01 ms P95 latency
- **TFrenzy ModelGuard (Protected)**: 140.8 FPS | 7.12 ms P95 latency
- **Measured Overhead**: ~1.19% (Target: ≤ 3.0%)
- **Network Calls During Steady-State Inference**: 0

*Note: Baseline benchmark previously measured on physical Jetson Orin Nano hardware.*
