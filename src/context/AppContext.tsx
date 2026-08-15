import React, { createContext, useContext, useState } from 'react';
import {
  ModelPackage,
  JetsonDevice,
  Deployment,
  AuditLog,
  AttackTestScenario,
  JetsonAgentState,
  AuditCategory,
  AuditSeverity
} from '../types';
import {
  INITIAL_MODELS,
  INITIAL_DEVICES,
  INITIAL_DEPLOYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ATTACK_SCENARIOS
} from '../data/mockData';
import { generateSHA256, createModelSignature, generateFingerprint, generateNonce } from '../services/cryptoEngine';

interface AppContextType {
  models: ModelPackage[];
  devices: JetsonDevice[];
  deployments: Deployment[];
  auditLogs: AuditLog[];
  attackScenarios: AttackTestScenario[];
  agentState: JetsonAgentState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  addModel: (modelData: Partial<ModelPackage>) => Promise<void>;
  revokeModel: (id: string, reason?: string) => void;
  registerDevice: (deviceData: Partial<JetsonDevice>) => Promise<void>;
  approveDevice: (id: string) => void;
  revokeDevice: (id: string) => void;
  createDeployment: (deploymentData: Partial<Deployment>) => Promise<void>;
  revokeDeployment: (id: string, reason?: string) => void;
  renewDeployment: (id: string, additionalDays: number) => void;
  addAuditLog: (category: AuditCategory, event: string, details: string, severity?: AuditSeverity, actor?: string, deviceId?: string, modelId?: string) => void;
  runAttackTest: (testId: string) => Promise<void>;
  startAgentRuntime: (deviceId: string, deploymentId: string) => void;
  stopAgentRuntime: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<ModelPackage[]>(INITIAL_MODELS);
  const [devices, setDevices] = useState<JetsonDevice[]>(INITIAL_DEVICES);
  const [deployments, setDeployments] = useState<Deployment[]>(INITIAL_DEPLOYMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [attackScenarios, setAttackScenarios] = useState<AttackTestScenario[]>(INITIAL_ATTACK_SCENARIOS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [agentState, setAgentState] = useState<JetsonAgentState>({
    isRunning: false,
    selectedDeviceId: INITIAL_DEVICES[0].id,
    selectedDeploymentId: INITIAL_DEPLOYMENTS[0].id,
    currentStep: 'idle',
    agentVersion: 'TFrenzy-Secure-Agent-v2.1.0-cpp',
    memoryDecryptedBufferAllocated: false,
    memoryBufferZeroed: false,
    plaintextFileDetectedOnDisk: false,
    liveFps: 0,
    liveLatencyMs: 0,
    currentInferenceFrame: 0,
    terminalLogs: [
      '[INFO] TFrenzy Secure Runtime Daemon v2.1.0 initialized.',
      '[INFO] Target GPU: NVIDIA Orin (nvgpu / Ampere architecture).',
      '[INFO] Mutual TLS stack initialized. Trust store loaded: /etc/tfrenzy/ca.crt',
      '[INFO] Status: Ready for model package deployment & mTLS authentication.'
    ]
  });

  const addAuditLog = (
    category: AuditCategory,
    event: string,
    details: string,
    severity: AuditSeverity = 'info',
    actor = 'Admin System',
    deviceId?: string,
    modelId?: string
  ) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      category,
      severity,
      event,
      actor,
      details,
      ipAddress: '192.168.1.10',
      deviceId,
      modelId
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };
const addModel = async (
  modelData: Partial<ModelPackage>
) => {
  const newModel: ModelPackage = {
    id:
      modelData.id ||
      `MOD-${Math.floor(
        1000 + Math.random() * 9000
      )}`,

    name:
      modelData.name ||
      "Untitled TensorRT Model",

    version:
      modelData.version ||
      "v1.0.0",

    originalFileName:
      modelData.originalFileName ||
      "model.engine",

    originalSizeBytes:
      modelData.originalSizeBytes ||
      0,

    encryptedSizeBytes:
      modelData.encryptedSizeBytes ||
      0,

    trtVersion:
      modelData.trtVersion ||
      "TensorRT 8.5.2",

    architecture:
      modelData.architecture ||
      "NVIDIA Jetson Orin Nano (Ampere GPU)",

    packageHash:
      modelData.packageHash ||
      "",

    signature:
      modelData.signature ||
      "",

    signingKeyId:
      modelData.signingKeyId ||
      "TF-RSA3072-ROOT-KEY-2026-PRIMARY",

    encryptionAlgo:
      modelData.encryptionAlgo ||
      "AES-256-GCM",

    signatureAlgo:
      modelData.signatureAlgo ||
      "RSA-3072-PSS",

    createdAt:
      new Date().toISOString(),

    createdBy:
      modelData.createdBy ||
      "Model Packaging Service",

    status:
      "active",

    inputShape:
      modelData.inputShape ||
      "1x3x640x640",

    precision:
      modelData.precision ||
      "FP16",
  };

  setModels(prev => [
    newModel,
    ...prev,
  ]);

  addAuditLog(
    "model",
    "Model Encrypted & Packaged Successfully",
    `Model "${newModel.name}" (${newModel.version}) was encrypted using AES-256-GCM. Package SHA-256: ${newModel.packageHash.slice(0, 16)}... RSA-3072-PSS signature attached.`,
    "info",
    "Model Packaging Service",
    undefined,
    newModel.id
  );
};
  const revokeModel = (id: string, reason = 'Administrative recall') => {
    setModels(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: 'revoked', revokedAt: new Date().toISOString(), revocationReason: reason }
          : m
      )
    );
    addAuditLog('model', 'Model Package Revoked', `Model ${id} marked as REVOKED. Reason: ${reason}`, 'warning', 'Admin System', undefined, id);
  };

  const registerDevice = async (deviceData: Partial<JetsonDevice>) => {
    const certFingerprint = generateFingerprint();
    const newDevice: JetsonDevice = {
      id: `DEV-JETSON-ORIN-${Math.floor(100 + Math.random() * 900)}`,
      name: deviceData.name || 'New Jetson Orin Device',
      serialNumber: deviceData.serialNumber || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      macAddress: deviceData.macAddress || `48:B0:2D:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
      ipAddress: deviceData.ipAddress || `192.168.1.${Math.floor(100 + Math.random() * 150)}`,
      deviceCertFingerprint: certFingerprint,
      certIssuer: 'CN=TFrenzy Device CA v2, O=TFrenzy Security',
      certExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A... [RSA-3072]\n-----END PUBLIC KEY-----',
      hardwareFuseHash: `HWFUSE-ORIN-${Math.floor(100000 + Math.random() * 900000)}`,
      jetpackVersion: deviceData.jetpackVersion || 'JetPack 5.1.2 (L4T R35.4.1)',
      cudaVersion: 'CUDA 11.4 / TensorRT 8.5.2',
      status: 'pending',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      location: deviceData.location || 'Field Node',
      assignedModelIds: []
    };

    setDevices(prev => [newDevice, ...prev]);
    addAuditLog('device', 'New Device Registered', `Jetson Device "${newDevice.name}" registered. Certificate fingerprint: ${certFingerprint.slice(0, 16)}... Status: PENDING APPROVAL`, 'info', 'Device Service', newDevice.id);
  };

  const approveDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'approved' } : d))
    );
    addAuditLog('device', 'Device Approved & Certificate Activated', `Device ${id} approved by administrator. Mutual TLS authentication enabled.`, 'info', 'Admin System', id);
  };

  const revokeDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'revoked' } : d))
    );
    addAuditLog('device', 'Device Revoked', `Device ${id} certificate revoked. Added to CRL. Access BLOCKED.`, 'critical', 'Admin System', id);
  };

  const createDeployment = async (deploymentData: Partial<Deployment>) => {
    const targetModel = models.find(m => m.id === deploymentData.modelId);
    const targetDevice = devices.find(d => d.id === deploymentData.deviceId);

    if (!targetModel || !targetDevice) {
      throw new Error('Invalid model or device ID');
    }

    const newDep: Deployment = {
      id: `DEP-${targetDevice.id.slice(-5)}-${targetModel.id.slice(-5)}`,
      modelId: targetModel.id,
      deviceId: targetDevice.id,
      modelName: `${targetModel.name} (${targetModel.version})`,
      modelVersion: targetModel.version,
      deviceName: targetDevice.name,
      deviceSerial: targetDevice.serialNumber,
      createdAt: new Date().toISOString(),
      expiresAt: deploymentData.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      status: 'active',
      maxOfflineDays: deploymentData.maxOfflineDays || 7,
      nonceIntervalSeconds: deploymentData.nonceIntervalSeconds || 30,
      licenseKey: `TF-LIC-2026-${targetDevice.id.slice(-6)}-${generateNonce()}`,
      activeNoncesUsed: []
    };

    setDeployments(prev => [newDep, ...prev]);

    // Update device assigned model IDs
    setDevices(prev =>
      prev.map(d =>
        d.id === targetDevice.id && !d.assignedModelIds.includes(targetModel.id)
          ? { ...d, assignedModelIds: [...d.assignedModelIds, targetModel.id] }
          : d
      )
    );

    addAuditLog(
      'deployment',
      'Deployment Binding Created',
      `Assigned Model "${targetModel.name}" to Device "${targetDevice.name}". License issued expiring on ${new Date(newDep.expiresAt).toLocaleDateString()}`,
      'info',
      'Deployment Service',
      targetDevice.id,
      targetModel.id
    );
  };

  const revokeDeployment = (id: string, reason = 'Policy recall') => {
    setDeployments(prev =>
      prev.map(dep =>
        dep.id === id
          ? { ...dep, status: 'revoked', revokedAt: new Date().toISOString(), revokedReason: reason }
          : dep
      )
    );
    addAuditLog('deployment', 'Deployment License Revoked', `Deployment ${id} revoked. Device will be refused model key on next ping.`, 'critical', 'Admin System');
  };

  const renewDeployment = (id: string, additionalDays: number) => {
    setDeployments(prev =>
      prev.map(dep => {
        if (dep.id === id) {
          const currentExp = new Date(dep.expiresAt > new Date().toISOString() ? dep.expiresAt : Date.now()).getTime();
          const newExp = new Date(currentExp + 1000 * 60 * 60 * 24 * additionalDays).toISOString();
          return { ...dep, expiresAt: newExp, status: 'active' };
        }
        return dep;
      })
    );
    addAuditLog('deployment', 'Deployment License Renewed', `Deployment ${id} extended by ${additionalDays} days.`, 'info', 'Admin System');
  };

  const runAttackTest = async (testId: string) => {
    setAttackScenarios(prev =>
      prev.map(s => (s.id === testId ? { ...s, status: 'running', logs: ['[INIT] Setting up attack environment simulation...'] } : s))
    );

    const test = attackScenarios.find(s => s.id === testId);
    if (!test) return;

    await new Promise(resolve => setTimeout(resolve, 800));

    let updatedLogs: string[] = [];
    let passed = true;
    let proof: any = {};

    if (test.code === 'ATTACK-PACKAGE-COPY') {
      updatedLogs = [
        '[ATTACK] Copying yolov8n_pose_fp16.engine.tfmodel to rogue Jetson MAC: AA:BB:CC:DD:EE:FF...',
        '[AGENT] Jetson Agent boots on rogue device. Initiating mTLS handshake with central platform...',
        '[SERVER] Level-1 Device Authentication: Checking certificate fingerprint FF:FF:FF:FF...',
        '[SECURITY DENIED] Certificate untrusted / Device ID DEV-JETSON-UNAUTHORIZED-99 status is REVOKED/UNAPPROVED.',
        '[SERVER] HTTP 403 Forbidden: Key release refused.',
        '[RESULT SUCCESS] Model protection held! Unusable plaintext file.'
      ];
      proof = { mtlsHandshakeOk: false, keyReleased: false };
    } else if (test.code === 'ATTACK-TAMPER-MANIFEST') {
      updatedLogs = [
        '[ATTACK] Corrupting 16 bytes of ciphertext in payload at offset 0x00421A0...',
        '[AGENT] Agent reads encrypted file package and validates RSA-3072 signature...',
        '[VERIFY] Computing SHA-256 hash: e3b0c44298fc1c149afbf4c8996fb924...',
        '[SECURITY DENIED] Signature mismatch! Digital signature check FAILED.',
        '[AGENT] Aborting load immediately. Memory allocation destroyed.',
        '[RESULT SUCCESS] Tamper detection verified.'
      ];
      proof = { verifiedSignature: false, keyReleased: false };
    } else if (test.code === 'ATTACK-UNASSIGNED-REQ') {
      updatedLogs = [
        '[ATTACK] Approved Jetson DEV-JETSON-ORIN-002 requests key for unassigned Model MOD-7732-RESNET50...',
        '[SERVER] Level-1 Device Auth OK (Cert Fingerprint C4:D5:E6...).',
        '[SERVER] Level-2 Deployment Matrix: Searching assignment for Device 002 + Model MOD-7732-RESNET50...',
        '[SECURITY DENIED] No active deployment record found for this model-device pairing.',
        '[RESULT SUCCESS] Authorization binding enforced.'
      ];
      proof = { mtlsHandshakeOk: true, keyReleased: false };
    } else if (test.code === 'ATTACK-REPLAY-NONCE') {
      const oldNonce = 'TF-NONCE-882190-001';
      updatedLogs = [
        `[ATTACK] Intercepted previous key request payload containing nonce "${oldNonce}".`,
        `[ATTACK] Replaying captured mTLS packet to activation server...`,
        `[SERVER] Nonce Validation Engine: Checking nonce cache for "${oldNonce}"...`,
        `[SECURITY DENIED] REPLAY DETECTED! Nonce "${oldNonce}" was already consumed at 21:40:12Z.`,
        `[RESULT SUCCESS] Anti-replay protection active.`
      ];
      proof = { keyReleased: false };
    } else if (test.code === 'ATTACK-EXPIRED-LICENSE') {
      updatedLogs = [
        '[ATTACK] Fast-forwarding system clock past deployment expiration timestamp...',
        '[AGENT] Agent sends activation request for expired deployment DEP-ORIN1-YOLO8...',
        '[SERVER] Level-2 Check: Deployment expiresAt < current_time (0 days remaining).',
        '[SECURITY DENIED] License Expired. Please issue renewal in TFrenzy Admin Portal.',
        '[RESULT SUCCESS] Expiration enforcement verified.'
      ];
      proof = { keyReleased: false };
    } else if (test.code === 'ATTACK-REVOKED-DEVICE') {
      updatedLogs = [
        '[ATTACK] Setting device DEV-JETSON-ORIN-001 status to REVOKED in portal...',
        '[AGENT] Jetson Agent pings activation server...',
        '[SERVER] Certificate Revocation List (CRL) check: Fingerprint A1:B2:C3... matches REVOKED list.',
        '[SECURITY DENIED] Connection closed instantly by server (TLS Handshake Alert 23).',
        '[RESULT SUCCESS] Instant revocation active.'
      ];
      proof = { keyReleased: false };
    } else if (test.code === 'ATTACK-DISK-PLAINTEXT-SCAN') {
      updatedLogs = [
        '[INSPECTION] Executing find / -name "*.engine" on Jetson filesystem during inference...',
        '[INSPECTION] Checking /tmp, /var/tmp, /dev/shm, /home/jetson, /usr/local...',
        '[INSPECTION] Scanning process memory dump of PID 4120 (TFrenzy Agent)...',
        '[MEMORY AUDIT] Model buffer decrypted directly in CUDA pinned host RAM.',
        '[MEMORY AUDIT] TensorRT cudaEngine deserialized. Plaintext buffer zero-filled with 0x00.',
        '[RESULT SUCCESS] 0 bytes of plaintext .engine file written to disk!'
      ];
      proof = { diskSearchPlaintextBytes: 0, keyReleased: true };
    } else if (test.code === 'BENCHMARK-PERFORMANCE-IMPACT') {
      updatedLogs = [
        '[BENCHMARK] Running 1,000 frames on YOLOv8n Pose Estimation (TensorRT FP16)...',
        '[BENCHMARK] Standard TensorRT (Unprotected): 60.1 FPS | P95 Latency: 16.5 ms',
        '[BENCHMARK] TFrenzy Secure Runtime: 59.8 FPS | P95 Latency: 16.7 ms',
        '[BENCHMARK] Steady-state FPS drop: 0.5% (Target: < 3.0%) -> PASSED',
        '[BENCHMARK] P95 Latency increase: 1.2% (Target: < 3.0%) -> PASSED',
        '[BENCHMARK] Agent RAM usage: 26.4 MB (Target: < 100 MB) -> PASSED',
        '[BENCHMARK] Network pings during steady-state inference: 0 -> PASSED'
      ];
      proof = { performanceDeltaPct: 0.5, keyReleased: true };
    }

    setAttackScenarios(prev =>
      prev.map(s =>
        s.id === testId
          ? {
              ...s,
              status: passed ? 'passed' : 'failed',
              lastRunTime: new Date().toISOString(),
              durationMs: 820,
              logs: updatedLogs,
              proofData: proof
            }
          : s
      )
    );

    addAuditLog(
      'attack_test',
      `Security Test Completed: ${test.title}`,
      `Attack test ${test.code} executed. Result: PASSED. Outcome: ${test.expectedOutcome}`,
      'info',
      'Attack Simulation Lab'
    );
  };

  const startAgentRuntime = (deviceId: string, deploymentId: string) => {
    const dev = devices.find(d => d.id === deviceId);
    const dep = deployments.find(dp => dp.id === deploymentId);

    setAgentState(prev => ({
      ...prev,
      isRunning: true,
      selectedDeviceId: deviceId,
      selectedDeploymentId: deploymentId,
      currentStep: 'cert_handshake',
      memoryDecryptedBufferAllocated: false,
      memoryBufferZeroed: false,
      plaintextFileDetectedOnDisk: false,
      liveFps: 0,
      liveLatencyMs: 0,
      currentInferenceFrame: 0,
      terminalLogs: [
        `[${new Date().toLocaleTimeString()}] Starting TFrenzy Secure Jetson Agent on ${dev?.name || deviceId}...`,
        `[${new Date().toLocaleTimeString()}] Target Deployment: ${dep?.modelName || deploymentId}`,
        `[${new Date().toLocaleTimeString()}] Step 1: Initiating Mutual TLS (mTLS) handshake with TFrenzy Auth Service...`
      ]
    }));

    // Step 2: License Check & Key Request after 800ms
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        currentStep: 'key_request',
        terminalLogs: [
          ...prev.terminalLogs,
          `[${new Date().toLocaleTimeString()}] [mTLS OK] Device Certificate Fingerprint ${dev?.deviceCertFingerprint.slice(0, 16)}... verified by CA.`,
          `[${new Date().toLocaleTimeString()}] Step 2: Requesting AES-256 decryption key for deployment ${deploymentId}...`,
          `[${new Date().toLocaleTimeString()}] Generated Nonce Challenge: ${generateNonce()}`
        ]
      }));
    }, 900);

    // Step 3: Decrypt in Memory
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        currentStep: 'decrypt_in_memory',
        memoryDecryptedBufferAllocated: true,
        terminalLogs: [
          ...prev.terminalLogs,
          `[${new Date().toLocaleTimeString()}] [AUTH OK] Level-1 Device & Level-2 Deployment authorization verified.`,
          `[${new Date().toLocaleTimeString()}] Step 3: Temporary AES-256-GCM key received in encrypted RAM.`,
          `[${new Date().toLocaleTimeString()}] Allocating 28.4 MB CUDA pinned host memory buffer...`,
          `[${new Date().toLocaleTimeString()}] Decrypting model package directly in memory buffer...`
        ]
      }));
    }, 1800);

    // Step 4: TensorRT CUDA Load & Zero Memory
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        currentStep: 'trt_cuda_load',
        memoryBufferZeroed: true,
        terminalLogs: [
          ...prev.terminalLogs,
          `[${new Date().toLocaleTimeString()}] Step 4: Deserializing ICudaEngine directly from RAM buffer into GPU Stream #0...`,
          `[${new Date().toLocaleTimeString()}] Zero-filling temporary plaintext RAM buffer with 0x00... [BUFFER CLEAN]`,
          `[${new Date().toLocaleTimeString()}] Filesystem verification: 0 bytes written to disk.`
        ]
      }));
    }, 2700);

    // Step 5: Inferencing loop
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        currentStep: 'inferencing',
        liveFps: 59.8,
        liveLatencyMs: 16.7,
        terminalLogs: [
          ...prev.terminalLogs,
          `[${new Date().toLocaleTimeString()}] [RUNTIME ACTIVE] TensorRT Inference Engine Running on Jetson Orin Ampere GPU.`,
          `[${new Date().toLocaleTimeString()}] Streaming live inference feeds (FP16 mode, batch size 1)...`
        ]
      }));
    }, 3500);
  };

  const stopAgentRuntime = () => {
    setAgentState(prev => ({
      ...prev,
      isRunning: false,
      currentStep: 'idle',
      liveFps: 0,
      liveLatencyMs: 0,
      terminalLogs: [
        ...prev.terminalLogs,
        `[${new Date().toLocaleTimeString()}] [STOPPED] Jetson Secure Agent runtime terminated. CUDA memory freed.`
      ]
    }));
  };

  return (
    <AppContext.Provider
      value={{
        models,
        devices,
        deployments,
        auditLogs,
        attackScenarios,
        agentState,
        activeTab,
        setActiveTab,
        addModel,
        revokeModel,
        registerDevice,
        approveDevice,
        revokeDevice,
        createDeployment,
        revokeDeployment,
        renewDeployment,
        addAuditLog,
        runAttackTest,
        startAgentRuntime,
        stopAgentRuntime
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
