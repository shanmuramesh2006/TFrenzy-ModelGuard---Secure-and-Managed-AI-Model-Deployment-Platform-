import { ModelPackage, JetsonDevice, Deployment, AuditLog, AttackTestScenario, PerformanceMetricPoint } from '../types';

export const INITIAL_MODELS: ModelPackage[] = [
  {
    id: 'MOD-9821-YOLO8',
    name: 'YOLOv8n Pose Estimation',
    version: 'v2.4.0',
    originalFileName: 'yolov8n_pose_fp16.engine',
    originalSizeBytes: 28450120, // ~28.4 MB
    encryptedSizeBytes: 28450280,
    trtVersion: 'TensorRT 8.5.2',
    architecture: 'NVIDIA Jetson Orin Nano (Ampere GPU - 1024 CUDA Cores)',
    packageHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    signature: 'TFRENZY_RSA3072_PSS_SIG_A98F7C32E10B4D568A9011CDEF43',
    signingKeyId: 'TF-RSA3072-ROOT-KEY-2026-PRIMARY',
    encryptionAlgo: 'AES-256-GCM',
    signatureAlgo: 'RSA-3072-PSS',
    createdAt: '2026-08-01T10:14:22Z',
    createdBy: 'admin@tfrenzy.io',
    status: 'active',
    inputShape: '1x3x640x640',
    precision: 'FP16'
  },
  {
    id: 'MOD-7732-RESNET50',
    name: 'ResNet-50 Defect Classifier',
    version: 'v1.1.0',
    originalFileName: 'resnet50_industrial_fp16.engine',
    originalSizeBytes: 102450100, // ~102.4 MB
    encryptedSizeBytes: 102450260,
    trtVersion: 'TensorRT 8.5.2',
    architecture: 'NVIDIA Jetson Orin Nano (Ampere GPU)',
    packageHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    signature: 'TFRENZY_RSA3072_PSS_SIG_B110294818F2039A4D5C9921',
    signingKeyId: 'TF-RSA3072-ROOT-KEY-2026-PRIMARY',
    encryptionAlgo: 'AES-256-GCM',
    signatureAlgo: 'RSA-3072-PSS',
    createdAt: '2026-08-03T14:30:00Z',
    createdBy: 'admin@tfrenzy.io',
    status: 'active',
    inputShape: '1x3x224x224',
    precision: 'FP16'
  },
  {
    id: 'MOD-3310-DEEPSTREAM',
    name: 'DeepStream Traffic Analytics',
    version: 'v3.0.1-INT8',
    originalFileName: 'deepstream_traffic_int8.engine',
    originalSizeBytes: 45120000, // ~45.1 MB
    encryptedSizeBytes: 45120160,
    trtVersion: 'TensorRT 8.6.0',
    architecture: 'NVIDIA Jetson Orin Nano 8GB',
    packageHash: 'a7c9381f21e05d2c418928d3b84126c88f114290a204918f0a09e12c12948011',
    signature: 'TFRENZY_RSA3072_PSS_SIG_C99182301AA04921BC84011D',
    signingKeyId: 'TF-RSA3072-ROOT-KEY-2026-PRIMARY',
    encryptionAlgo: 'AES-256-GCM',
    signatureAlgo: 'RSA-3072-PSS',
    createdAt: '2026-08-05T09:12:15Z',
    createdBy: 'admin@tfrenzy.io',
    status: 'active',
    inputShape: '4x3x1080x1920',
    precision: 'INT8'
  }
];

export const INITIAL_DEVICES: JetsonDevice[] = [
  {
    id: 'DEV-JETSON-ORIN-001',
    name: 'Jetson Orin Nano 8GB (Lab Testing Unit)',
    serialNumber: '1423822091238',
    macAddress: '48:B0:2D:1A:89:FE',
    ipAddress: '192.168.1.105',
    deviceCertFingerprint: 'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:11:22:33:44',
    certIssuer: 'CN=TFrenzy Device CA v2, O=TFrenzy Security',
    certExpiresAt: '2027-08-01T00:00:00Z',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz892... [RSA-3072]\n-----END PUBLIC KEY-----',
    hardwareFuseHash: 'HWFUSE-ORIN-908123-AMPERE-SECURE-KEY-8123',
    jetpackVersion: 'JetPack 5.1.2 (L4T R35.4.1)',
    cudaVersion: 'CUDA 11.4 / TensorRT 8.5.2',
    status: 'approved',
    registeredAt: '2026-07-15T08:00:00Z',
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
    location: 'Building A - AI QA Lab 03',
    assignedModelIds: ['MOD-9821-YOLO8', 'MOD-7732-RESNET50']
  },
  {
    id: 'DEV-JETSON-ORIN-002',
    name: 'Jetson Orin Nano 4GB (Field Node Alpha)',
    serialNumber: '1423822094412',
    macAddress: '48:B0:2D:1A:99:C2',
    ipAddress: '10.0.4.12',
    deviceCertFingerprint: 'C4:D5:E6:F7:08:19:2A:3B:4C:5D:6E:7F:80:91:02:13:24:35:46:57',
    certIssuer: 'CN=TFrenzy Device CA v2, O=TFrenzy Security',
    certExpiresAt: '2027-08-01T00:00:00Z',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA... [RSA-3072]\n-----END PUBLIC KEY-----',
    hardwareFuseHash: 'HWFUSE-ORIN-441209-AMPERE-SECURE-KEY-4412',
    jetpackVersion: 'JetPack 5.1.2 (L4T R35.4.1)',
    cudaVersion: 'CUDA 11.4 / TensorRT 8.5.2',
    status: 'approved',
    registeredAt: '2026-07-20T11:45:00Z',
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    location: 'Edge Node Gate #2',
    assignedModelIds: ['MOD-3310-DEEPSTREAM']
  },
  {
    id: 'DEV-JETSON-UNAUTHORIZED-99',
    name: 'Rogue / Copied Jetson Orin Nano (Unapproved)',
    serialNumber: '9999999999999',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    ipAddress: '192.168.1.220',
    deviceCertFingerprint: 'FF:FF:FF:FF:FF:FF:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
    certIssuer: 'Self-Signed Untrusted Root',
    certExpiresAt: '2026-12-31T00:00:00Z',
    publicKey: '-----BEGIN PUBLIC KEY-----\nUNTRUSTED_KEY...\n-----END PUBLIC KEY-----',
    hardwareFuseHash: 'HWFUSE-ROGUE-UNREGISTERED',
    jetpackVersion: 'JetPack 5.1.0',
    cudaVersion: 'CUDA 11.4',
    status: 'revoked',
    registeredAt: '2026-08-06T19:00:00Z',
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    location: 'Unknown External Device',
    assignedModelIds: []
  }
];

export const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: 'DEP-ORIN1-YOLO8',
    modelId: 'MOD-9821-YOLO8',
    deviceId: 'DEV-JETSON-ORIN-001',
    modelName: 'YOLOv8n Pose Estimation (v2.4.0)',
    modelVersion: 'v2.4.0',
    deviceName: 'Jetson Orin Nano 8GB (Lab Testing Unit)',
    deviceSerial: '1423822091238',
    createdAt: '2026-08-02T10:00:00Z',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days in future
    status: 'active',
    maxOfflineDays: 7,
    nonceIntervalSeconds: 30,
    licenseKey: 'TF-LIC-2026-ORIN001-YOLO8-VALID-AES256',
    activeNoncesUsed: ['TF-NONCE-882190-001']
  },
  {
    id: 'DEP-ORIN2-DEEPSTREAM',
    modelId: 'MOD-3310-DEEPSTREAM',
    deviceId: 'DEV-JETSON-ORIN-002',
    modelName: 'DeepStream Traffic Analytics (v3.0.1-INT8)',
    modelVersion: 'v3.0.1-INT8',
    deviceName: 'Jetson Orin Nano 4GB (Field Node Alpha)',
    deviceSerial: '1423822094412',
    createdAt: '2026-08-05T12:00:00Z',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days
    status: 'active',
    maxOfflineDays: 3,
    nonceIntervalSeconds: 60,
    licenseKey: 'TF-LIC-2026-ORIN002-DS-VALID-AES256',
    activeNoncesUsed: ['TF-NONCE-904123-002']
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-08-07T21:40:12Z',
    category: 'agent',
    severity: 'info',
    event: 'mTLS Authentication Success',
    actor: 'DEV-JETSON-ORIN-001',
    details: 'Mutual TLS Handshake completed using device cert fingerprint A1:B2:C3... Client certificate validated against TFrenzy Device Root CA v2.',
    ipAddress: '192.168.1.105',
    deviceId: 'DEV-JETSON-ORIN-001'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-08-07T21:40:15Z',
    category: 'deployment',
    severity: 'info',
    event: 'Two-Level Activation Succeeded & Key Released',
    actor: 'Licence & Auth Service',
    details: 'Level 1 (Device Identity Verified) OK. Level 2 (Deployment Binding DEP-ORIN1-YOLO8 Valid & Active) OK. Temporary AES-256 decryption key issued.',
    ipAddress: '192.168.1.105',
    deviceId: 'DEV-JETSON-ORIN-001',
    modelId: 'MOD-9821-YOLO8'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-08-07T21:40:16Z',
    category: 'agent',
    severity: 'info',
    event: 'In-Memory Decryption & TensorRT CUDA Load',
    actor: 'TFrenzy Secure Runtime (C++)',
    details: 'Encrypted model package verified (RSA-3072 signature OK). Decrypted directly in RAM. Loaded into TensorRT CUDA stream #0. Plaintext memory buffer zeroed out. 0 bytes written to disk.',
    ipAddress: '192.168.1.105',
    deviceId: 'DEV-JETSON-ORIN-001'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-08-07T21:30:00Z',
    category: 'attack_test',
    severity: 'warning',
    event: 'Security Test Triggered: Copied Model File on Rogue Device',
    actor: 'DEV-JETSON-UNAUTHORIZED-99',
    details: 'Attack Simulation #1 executed. Attempted model activation on unassigned device. System correctly rejected key release with HTTP 403 Forbidden: Device not in deployment binding matrix.',
    ipAddress: '192.168.1.220',
    deviceId: 'DEV-JETSON-UNAUTHORIZED-99'
  }
];

export const INITIAL_ATTACK_SCENARIOS: AttackTestScenario[] = [
  {
    id: 'TEST-01',
    code: 'ATTACK-PACKAGE-COPY',
    title: 'Copying Encrypted Package to Unauthorized Jetson Device',
    category: 'Copy Protection',
    description: 'Simulates an attacker copying the encrypted `.tfmodel` package and agent application folder to an unapproved or different Jetson device.',
    expectedOutcome: 'System rejects key release during Level-1 Device Authentication or Level-2 Binding check. Model cannot be decrypted.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-02',
    code: 'ATTACK-TAMPER-MANIFEST',
    title: 'Modifying Encrypted Package or Manifest Binary',
    category: 'Tampering',
    description: 'Simulates flipping bits or tampering with the encrypted payload / signature manifest file before launching runtime.',
    expectedOutcome: 'Digital signature verification fails (RSA-3072-PSS mismatch) or GCM auth tag mismatch. Model loading aborted immediately.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-03',
    code: 'ATTACK-UNASSIGNED-REQ',
    title: 'Requesting Model Key Not Assigned To Device',
    category: 'Authorization',
    description: 'A valid registered device requests a decryption key for a model that has NOT been explicitly assigned via deployment matrix.',
    expectedOutcome: 'Level-2 Authorization fails with "Model-to-Device Assignment Missing". Key release blocked.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-04',
    code: 'ATTACK-REPLAY-NONCE',
    title: 'Replaying Old Activation Request / Token',
    category: 'Replay',
    description: 'Attacker captures a previously successful mTLS key request payload and attempts to replay it.',
    expectedOutcome: 'Server rejects request due to duplicate or stale nonce challenge string. Request denied.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-05',
    code: 'ATTACK-EXPIRED-LICENSE',
    title: 'Using Expired Deployment License',
    category: 'Expiration',
    description: 'Simulates device runtime launching after the deployment expiration timestamp has passed without network renewal.',
    expectedOutcome: 'Activation service detects license expiry. Refuses key issuance until deployment is renewed.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-06',
    code: 'ATTACK-REVOKED-DEVICE',
    title: 'Attempting Launch from Revoked Device/Deployment',
    category: 'Revocation',
    description: 'An administrator revokes a device or deployment in the TFrenzy portal, then the device attempts to activate.',
    expectedOutcome: 'Immediate rejection during mTLS certificate revocation list (CRL) check or deployment status lookup.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-07',
    code: 'ATTACK-DISK-PLAINTEXT-SCAN',
    title: 'Filesystem Inspection for Plaintext `.engine` Files',
    category: 'Disk Hygiene',
    description: 'Scans `/tmp`, `/var/tmp`, `/dev/shm`, and swap partitions for any unencrypted TensorRT `.engine` plaintext remnants.',
    expectedOutcome: '0 bytes of unencrypted model file found on disk. Decryption strictly occurs in CUDA pinned host RAM.',
    status: 'idle',
    logs: []
  },
  {
    id: 'TEST-08',
    code: 'BENCHMARK-PERFORMANCE-IMPACT',
    title: 'Comparing Protected vs Normal TensorRT Performance',
    category: 'Performance',
    description: 'Measures steady-state FPS, P95 latency, agent CPU usage, and RAM overhead to verify compliance with <3% overhead target.',
    expectedOutcome: 'FPS impact: < 1.5%, P95 Latency impact: < 1.2%, Agent RAM: ~28 MB (<100 MB target), Network calls during inference: 0.',
    status: 'idle',
    logs: []
  }
];

export const INITIAL_PERFORMANCE_METRICS: PerformanceMetricPoint[] = [
  { timeLabel: '0s (Boot)', unprotectedFps: 0, protectedFps: 0, unprotectedLatencyMs: 0, protectedLatencyMs: 0, cpuUsagePct: 1.2, ramUsageMb: 18 },
  { timeLabel: '1s (Init)', unprotectedFps: 42.0, protectedFps: 41.5, unprotectedLatencyMs: 23.8, protectedLatencyMs: 24.1, cpuUsagePct: 2.8, ramUsageMb: 24 },
  { timeLabel: '2s (Stream)', unprotectedFps: 60.1, protectedFps: 59.8, unprotectedLatencyMs: 16.6, protectedLatencyMs: 16.7, cpuUsagePct: 1.9, ramUsageMb: 26 },
  { timeLabel: '3s (Stream)', unprotectedFps: 60.0, protectedFps: 59.7, unprotectedLatencyMs: 16.6, protectedLatencyMs: 16.8, cpuUsagePct: 1.8, ramUsageMb: 26 },
  { timeLabel: '4s (Stream)', unprotectedFps: 60.2, protectedFps: 59.9, unprotectedLatencyMs: 16.5, protectedLatencyMs: 16.6, cpuUsagePct: 1.7, ramUsageMb: 26 },
  { timeLabel: '5s (Stream)', unprotectedFps: 59.9, protectedFps: 59.6, unprotectedLatencyMs: 16.7, protectedLatencyMs: 16.8, cpuUsagePct: 1.8, ramUsageMb: 26 },
];
