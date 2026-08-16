# 🔐 TFrenzy ModelGuard — Secure and Managed AI Model Deployment Platform

TFrenzy ModelGuard is a security-focused platform designed to protect and centrally manage AI model deployment on authorized edge devices such as the **NVIDIA Jetson Orin Nano**.

The system converts an unmanaged TensorRT model into a **secure, encrypted, device-authorized model package** that can only be used when the required device authentication, deployment assignment, and activation license conditions are satisfied.

## 🚀 Project Overview

AI models deployed on edge devices can be copied, modified, or executed on unauthorized hardware.

TFrenzy ModelGuard addresses these challenges by introducing:

* 🔐 AES-256-GCM model encryption
* ✍️ RSA-3072-PSS digital signature verification
* 🖥️ Device authentication
* 🔒 Mutual TLS (mTLS) communication
* 🎫 Deployment and activation license validation
* 🛡️ Model integrity verification using SHA-256
* 🔄 Nonce-based replay protection
* 🚫 Revocation and expiration checks
* 💾 In-memory model decryption
* 🧹 Secure memory cleanup after model usage
* ⚡ Low-overhead protected inference

## 🎯 Objectives

The primary objectives of ModelGuard are:

1. Protect AI models while stored and transferred.
2. Allow models to execute only on registered devices.
3. Prevent unauthorized copying and execution of model packages.
4. Verify model integrity and authenticity before execution.
5. Enforce deployment licenses and device-model assignments.
6. Avoid writing decrypted models to disk.
7. Maintain minimal performance overhead during inference.

## 🏗️ High-Level Architecture

```text
                    ┌──────────────────────────┐
                    │     TFrenzy Backend      │
                    │                          │
                    │ • Device Management      │
                    │ • Model Management       │
                    │ • License Validation     │
                    │ • Key Management         │
                    │ • Deployment Control     │
                    └────────────┬─────────────┘
                                 │
                              mTLS
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Jetson Agent        │
                    │                          │
                    │ • Device Authentication │
                    │ • Challenge / Response   │
                    │ • Package Retrieval      │
                    │ • Signature Verification │
                    │ • Hash Verification      │
                    │ • License Validation     │
                    └────────────┬─────────────┘
                                 │
                         Secure Key Release
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │   In-Memory Decryption   │
                    │                          │
                    │       AES-256-GCM        │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │   TensorRT Runtime       │
                    │                          │
                    │ Protected Model          │
                    │      Inference           │
                    └──────────────────────────┘
```

## 🔐 Security Workflow

The protected model deployment follows this general workflow:

```text
TensorRT Model
      │
      ▼
SHA-256 Hash
      │
      ▼
AES-256-GCM Encryption
      │
      ▼
Signed Model Manifest
(RSA-3072-PSS)
      │
      ▼
Secure Model Package
      │
      ▼
Registered Jetson Device
      │
      ▼
mTLS Authentication
      │
      ▼
Device Challenge
      │
      ▼
License + Deployment Validation
      │
      ▼
Signature + Hash Verification
      │
      ▼
Secure Key Release
      │
      ▼
In-Memory Decryption
      │
      ▼
TensorRT Engine Load
      │
      ▼
Inference
```

## 🛡️ Security Features

### AES-256-GCM Encryption

TensorRT model packages are encrypted using **AES-256-GCM** to provide confidentiality and authenticated encryption.

The encrypted package includes the necessary authentication information required to detect tampering.

### RSA-3072-PSS Digital Signature

The model manifest is digitally signed using **RSA-3072-PSS**.

This ensures that a modified or forged model package can be detected before execution.

### SHA-256 Integrity Verification

SHA-256 is used to verify that the model package has not been modified during storage or transfer.

### Device Authentication

Only registered and authorized Jetson devices should be allowed to request protected models.

The device identity is associated with the deployment configuration.

### Mutual TLS

The architecture uses mutual TLS to establish authenticated communication between the Jetson Agent and backend.

This provides authentication for both communication endpoints.

### License Enforcement

Before releasing the model decryption material, the system validates the deployment and activation conditions.

Expired or revoked deployments are rejected.

### Replay Protection

Nonce/challenge-based validation helps prevent replaying previously captured authentication requests.

### In-Memory Decryption

The protected model is intended to be decrypted in memory rather than being stored as a plaintext `.engine` file on disk.

## ⚡ Performance

The project was evaluated to measure the overhead introduced by the protection layer.

| Metric               | Direct TensorRT | ModelGuard Protected |
| -------------------- | --------------: | -------------------: |
| YOLOv11x FP16 FPS    |       142.5 FPS |            140.8 FPS |
| P95 Latency          |         7.01 ms |              7.12 ms |
| Inference Overhead   |               — |               ~1.19% |
| Additional Agent RAM |               — |               ~42 MB |

The benchmark indicates that the protection layer introduces only a small steady-state inference performance overhead.

## 🧰 Technology Stack

### Backend

* Node.js
* TypeScript
* Express.js
* PostgreSQL

### Security

* AES-256-GCM
* RSA-3072-PSS
* SHA-256
* Mutual TLS (mTLS)
* Nonce-based replay protection
* License validation

### Edge Device

* NVIDIA Jetson Orin Nano
* Python
* TensorRT
* CUDA

### Development Tools

* Git
* GitHub
* PowerShell
* Postman

## 📁 Project Structure

```text
TFrenzy-ModelGuard/
│
├── agent/
├── assets/
├── src/
├── jetson-agent/
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── README.md
├── server.ts
│
└── JETSON_SETUP.md
```

> The exact structure may evolve as the implementation develops.

## 🔌 Backend API

The prototype backend provides APIs for areas including:

* Device registration
* Model management
* Model version management
* Model package creation
* Model encryption
* SHA-256 hashing
* Deployment management
* Security validation
* Nonce handling

Example API areas:

```text
/api/devices
/api/models
/api/model-versions
/api/model-packages
/api/model-packages/encrypt-test
/api/security/hash
/api/security/validate/:deploymentId
/api/security/consume-nonce
```

## 🧪 Security Testing

The project includes security-oriented testing for scenarios such as:

* Unauthorized device access
* Modified model packages
* Invalid signatures
* Hash mismatches
* Invalid authentication requests
* Replay attempts
* Expired licenses
* Revoked deployments
* Unauthorized model access

## 📊 Current Implementation Status

| Component                          | Status |
| ---------------------------------- | ------ |
| AES-256-GCM Encryption             | ✅      |
| RSA-3072-PSS Verification          | ✅      |
| SHA-256 Integrity Verification     | ✅      |
| Device Authentication Architecture | 🟡     |
| mTLS Integration                   | 🟡     |
| Nonce / Replay Protection          | ✅      |
| License Validation                 | 🟡     |
| License Renewal                    | 🟡     |
| Backend API                        | 🟡     |
| Jetson Agent                       | 🟡     |
| TensorRT Runtime Integration       | 🟡     |
| CUDA Secure Memory Handling        | 🟡     |
| Secure Memory Zeroing              | 🟡     |
| Real Protected Inference Loop      | 🟡     |

## ⚠️ Prototype Disclaimer

This project is an internship/prototype implementation intended to demonstrate secure AI model deployment concepts.

A production deployment would require additional hardening, including hardware-backed key storage, stronger device attestation, production-grade certificate management, secure key-release infrastructure, and comprehensive penetration testing.

## 🔮 Future Enhancements

* Hardware-backed key storage
* TPM / secure-element integration
* Stronger Jetson device attestation
* Automated certificate provisioning
* License renewal service
* Centralized key management service
* Production-grade audit logging
* Kubernetes-based backend deployment
* Secure TensorRT memory management
* CUDA-based protected inference
* Automated security testing pipeline

## 👩‍💻 Author

**Shanmugapriya R**

B.Tech — Artificial Intelligence & Data Science

### Project

**TFrenzy ModelGuard — Secure and Managed AI Model Deployment Platform**

---

⭐ If you find this project useful, consider giving the repository a star!
