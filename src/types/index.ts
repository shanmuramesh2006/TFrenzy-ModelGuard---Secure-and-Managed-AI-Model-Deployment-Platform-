export type UserRole = 'admin' | 'security_auditor' | 'field_operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  mfaEnabled: boolean;
  lastLogin: string;
}

export type EncryptionAlgorithm = 'AES-256-GCM';
export type SignatureAlgorithm = 'RSA-3072-PSS' | 'ECDSA-P256';

export interface ModelPackage {
  id: string;
  name: string;
  version: string;
  originalFileName: string;
  originalSizeBytes: number;
  encryptedSizeBytes: number;
  trtVersion: string;
  architecture: string; // e.g. "NVIDIA Jetson Orin Nano (Ampere GPU)"
  packageHash: string; // SHA-256 of encrypted package
  signature: string; // Digital signature
  signingKeyId: string;
  encryptionAlgo: EncryptionAlgorithm;
  signatureAlgo: SignatureAlgorithm;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'revoked';
  revokedAt?: string;
  revocationReason?: string;
  inputShape: string; // e.g. "1x3x640x640"
  precision: 'FP16' | 'INT8' | 'FP32';
}

export type DeviceStatus = 'pending' | 'approved' | 'active' | 'revoked' | 'suspended';

export interface JetsonDevice {
  id: string;
  name: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
  deviceCertFingerprint: string;
  certIssuer: string;
  certExpiresAt: string;
  publicKey: string;
  hardwareFuseHash: string;
  jetpackVersion: string; // e.g. "JetPack 5.1.2 (L4T R35.4.1)"
  cudaVersion: string; // e.g. "CUDA 11.4 / TensorRT 8.5.2"
  status: DeviceStatus;
  registeredAt: string;
  lastSeenAt: string;
  location: string;
  assignedModelIds: string[];
}

export type DeploymentStatus = 'active' | 'pending_approval' | 'expired' | 'revoked';

export interface Deployment {
  id: string;
  modelId: string;
  deviceId: string;
  modelName: string;
  modelVersion: string;
  deviceName: string;
  deviceSerial: string;
  createdAt: string;
  expiresAt: string;
  status: DeploymentStatus;
  maxOfflineDays: number;
  nonceIntervalSeconds: number;
  licenseKey: string;
  activeNoncesUsed: string[];
  revokedAt?: string;
  revokedReason?: string;
}

export interface ActivationLicense {
  licenseId: string;
  deploymentId: string;
  modelPackageHash: string;
  deviceCertHash: string;
  issuedAt: string;
  expiresAt: string;
  nonceChallenge: string;
  signedToken: string;
  keyReleasePayloadEncrypted: string;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export type AuditCategory = 'model' | 'device' | 'deployment' | 'auth' | 'agent' | 'attack_test';

export interface AuditLog {
  id: string;
  timestamp: string;
  category: AuditCategory;
  severity: AuditSeverity;
  event: string;
  actor: string;
  details: string;
  ipAddress: string;
  deviceId?: string;
  modelId?: string;
}

export interface AttackTestScenario {
  id: string;
  code: string;
  title: string;
  category: 'Copy Protection' | 'Tampering' | 'Authorization' | 'Replay' | 'Expiration' | 'Revocation' | 'Disk Hygiene' | 'Performance';
  description: string;
  expectedOutcome: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  lastRunTime?: string;
  durationMs?: number;
  logs: string[];
  proofData?: {
    receivedHash?: string;
    expectedHash?: string;
    verifiedSignature?: boolean;
    mtlsHandshakeOk?: boolean;
    keyReleased?: boolean;
    diskSearchPlaintextBytes?: number;
    performanceDeltaPct?: number;
  };
}

export interface PerformanceMetricPoint {
  timeLabel: string;
  unprotectedFps: number;
  protectedFps: number;
  unprotectedLatencyMs: number;
  protectedLatencyMs: number;
  cpuUsagePct: number;
  ramUsageMb: number;
}

export interface JetsonAgentState {
  isRunning: boolean;
  selectedDeviceId: string;
  selectedDeploymentId: string;
  currentStep: 'idle' | 'cert_handshake' | 'license_check' | 'key_request' | 'decrypt_in_memory' | 'trt_cuda_load' | 'zero_memory' | 'inferencing' | 'error';
  agentVersion: string;
  memoryDecryptedBufferAllocated: boolean;
  memoryBufferZeroed: boolean;
  plaintextFileDetectedOnDisk: boolean;
  liveFps: number;
  liveLatencyMs: number;
  currentInferenceFrame: number;
  terminalLogs: string[];
}
