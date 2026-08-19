import React from 'react';
import {
  Network,
  Lock,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Key,
  ArrowDown,
  ArrowRight,
  Database
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1E2638]">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-mono">
          <Network className="w-5 h-5 text-[#00F0FF]" />
          TFrenzy ModelGuard System Architecture & Security Specification
        </h1>
        <p className="text-xs text-[#9CA3AF] mt-1 max-w-3xl font-mono">
          Visual documentation of the data flow, Two-Level Activation sequence, key management hierarchy, and in-memory zero-fill CUDA execution.
        </p>
      </div>

      {/* Pipeline Diagram Card */}
      <div className="glass-card border border-[#1E2638] p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-mono">
          <Database className="w-4.5 h-4.5 text-[#00F0FF]" />
          End-to-End Platform Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Step 1 */}
          <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-[#111625] text-[#00F0FF] border border-[#1E2638] font-extrabold font-mono text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-extrabold text-white">Model Packaging API</h4>
            <p className="text-[#6B7280] leading-relaxed text-[11px]">
              Admin uploads <code className="text-[#00F0FF]">.engine</code>. AES-256-GCM key encrypts payload, RSA-3072 signs manifest.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#111625] text-emerald-400 border border-[#1E2638] font-extrabold font-mono text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-extrabold text-white">Device & Deployment Binding</h4>
            <p className="text-[#6B7280] leading-relaxed text-[11px]">
              Device registers certificate fingerprint. Admin creates explicit Model-to-Device assignment & expiry.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#111625] text-indigo-400 border border-[#1E2638] font-extrabold font-mono text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-extrabold text-white">Two-Level Activation</h4>
            <p className="text-[#6B7280] leading-relaxed text-[11px]">
              Jetson pings over mTLS. Level 1 checks Cert & CRL; Level 2 checks Model Binding & Nonce Challenge.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#111625] text-amber-400 border border-[#1E2638] font-extrabold font-mono text-xs flex items-center justify-center">
              4
            </div>
            <h4 className="font-extrabold text-white">In-Memory CUDA Load</h4>
            <p className="text-[#6B7280] leading-relaxed text-[11px]">
              Model decrypted directly into RAM. Deserialized to GPU stream. Buffer zero-filled. 0 bytes on disk.
            </p>
          </div>
        </div>
      </div>

      {/* Two-Level Activation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card border border-[#1E2638] p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-mono">
            <Lock className="w-4 h-4 text-emerald-400" />
            Two-Level Activation Protocol
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="bg-[#07090E] p-4 rounded-xl border border-emerald-500/30 space-y-1.5">
              <span className="text-emerald-400 font-extrabold block">Level 1: Device Authentication (mTLS)</span>
              <p className="text-[#9CA3AF]">• Verifies client x509 certificate against TFrenzy Device Root CA</p>
              <p className="text-[#9CA3AF]">• Checks Certificate Revocation List (CRL)</p>
              <p className="text-[#9CA3AF]">• Validates matching private key challenge signature</p>
            </div>

            <div className="bg-[#07090E] p-4 rounded-xl border border-[#00F0FF]/30 space-y-1.5">
              <span className="text-[#00F0FF] font-extrabold block">Level 2: Deployment Authorization</span>
              <p className="text-[#9CA3AF]">• Verifies active model-to-device binding record</p>
              <p className="text-[#9CA3AF]">• Checks deployment expiration timestamp</p>
              <p className="text-[#9CA3AF]">• Consumes single-use nonce to prevent replay attacks</p>
            </div>
          </div>
        </div>

        {/* Cryptographic Key Architecture */}
        <div className="glass-card border border-[#1E2638] p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-mono">
            <Key className="w-4 h-4 text-amber-400" />
            Key Management & Trust Root
          </h3>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center bg-[#07090E] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[#6B7280]">Model Payload Encryption</span>
              <span className="text-[#00F0FF] font-extrabold">AES-256-GCM (96-bit IV)</span>
            </div>
            <div className="flex justify-between items-center bg-[#07090E] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[#6B7280]">Package Digital Signature</span>
              <span className="text-emerald-400 font-extrabold">RSA-3072-PSS</span>
            </div>
            <div className="flex justify-between items-center bg-[#07090E] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[#6B7280]">Device Identity Cert</span>
              <span className="text-indigo-400 font-extrabold">x509 Mutual TLS</span>
            </div>
            <div className="flex justify-between items-center bg-[#07090E] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[#6B7280]">Hardware Identity</span>
              <span className="text-amber-400 font-extrabold">Hardware Identity Hash (Prototype)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

