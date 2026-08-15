import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Deployment } from '../types';
import {
  Rocket,
  Plus,
  Key,
  Calendar,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Eye,
  X,
  RotateCw,
  Lock,
  Box,
  Cpu
} from 'lucide-react';

export const DeploymentsPage: React.FC = () => {
  const { models, devices, deployments, createDeployment, revokeDeployment, renewDeployment } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<Deployment | null>(null);

  // Form states
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxOfflineDays, setMaxOfflineDays] = useState(7);
  const [nonceIntervalSeconds, setNonceIntervalSeconds] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeModels = models.filter(m => m.status === 'active');
  const approvedDevices = devices.filter(d => d.status === 'approved');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId || !selectedDeviceId) return;

    setIsSubmitting(true);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * expiryDays).toISOString();

    await createDeployment({
      modelId: selectedModelId,
      deviceId: selectedDeviceId,
      expiresAt,
      maxOfflineDays,
      nonceIntervalSeconds
    });

    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedModelId('');
    setSelectedDeviceId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-[#1E2638]">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#00F0FF]" />
            Model-to-Device Deployments & Activation Licences
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Explicitly maps an encrypted TensorRT model package to an authorized Jetson device with expiration rules and anti-replay nonce policies.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeModels.length > 0) setSelectedModelId(activeModels[0].id);
            if (approvedDevices.length > 0) setSelectedDeviceId(approvedDevices[0].id);
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 font-mono shadow-lg shadow-[#00F0FF]/15 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Model Deployment</span>
        </button>
      </div>

      {/* Deployments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {deployments.map(dep => {
          const isRevoked = dep.status === 'revoked';
          const isExpired = dep.status === 'expired' || new Date(dep.expiresAt) < new Date();

          return (
            <div
              key={dep.id}
              className={`glass-card rounded-2xl p-6 flex flex-col justify-between transition-all border ${
                isRevoked
                  ? 'border-red-500/40 bg-red-950/10'
                  : isExpired
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-[#1E2638] hover:border-[#2D3A54]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-[#00F0FF] font-mono text-xs font-bold">
                      DEP
                    </span>
                    <div>
                      <span className="text-xs text-[#6B7280] font-mono">ID: {dep.id}</span>
                      <h3 className="text-lg font-extrabold text-white">{dep.modelName}</h3>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                      isRevoked
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isExpired
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : dep.status}
                  </span>
                </div>

                {/* Target Device */}
                <div className="bg-[#07090E] p-3.5 rounded-xl border border-[#1E2638] space-y-1.5 my-3.5 text-xs">
                  <div className="flex items-center gap-2 text-white font-medium font-mono">
                    <Cpu className="w-4 h-4 text-[#00F0FF]" />
                    <span>TARGET DEVICE: <strong className="text-[#00F0FF]">{dep.deviceName}</strong></span>
                  </div>
                  <div className="flex justify-between text-[#6B7280] text-[11px] font-mono pl-6">
                    <span>SERIAL: {dep.deviceSerial}</span>
                    <span>DEVICE ID: {dep.deviceId}</span>
                  </div>
                </div>

                {/* Terms */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-[#1E2638] py-3.5 text-[#6B7280] font-mono">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#6B7280]">EXPIRATION DATE</span>
                    <span className="text-[#00F0FF] font-bold">{new Date(dep.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#6B7280]">MAX OFFLINE DAYS</span>
                    <span className="text-white font-medium">{dep.maxOfflineDays} DAYS</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#6B7280]">NONCE INTERVAL</span>
                    <span className="text-white font-medium">{dep.nonceIntervalSeconds} SECONDS</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#6B7280]">LICENCE STATUS</span>
                    <span className="text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3.5 border-t border-[#1E2638] flex items-center justify-between gap-2 font-mono">
                <button
                  onClick={() => setSelectedLicense(dep)}
                  className="bg-[#111625] hover:bg-[#151C2E] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all border border-[#1E2638] hover:border-[#2D3A54] flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>INSPECT LICENCE</span>
                </button>

                {!isRevoked && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => renewDeployment(dep.id, 30)}
                      title="Renew Deployment for 30 Days"
                      className="bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>+30d</span>
                    </button>
                    <button
                      onClick={() => revokeDeployment(dep.id)}
                      title="Revoke Deployment"
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>REVOKE</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D121F] border border-[#1E2638] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-[#6B7280] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
              <Rocket className="w-5 h-5 text-[#00F0FF]" />
              Create Model-to-Device Deployment
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-5">
              Select an encrypted model package and assign it to an approved Jetson Orin Nano device.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Select Encrypted Model</label>
                <select
                  value={selectedModelId}
                  onChange={e => setSelectedModelId(e.target.value)}
                  required
                  className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                >
                  {activeModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.version}) - [{m.precision}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Select Approved Jetson Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  required
                  className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                >
                  {approvedDevices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Expiry (Days)</label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={e => setExpiryDays(parseInt(e.target.value) || 30)}
                    min={1}
                    max={365}
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Max Offline (Days)</label>
                  <input
                    type="number"
                    value={maxOfflineDays}
                    onChange={e => setMaxOfflineDays(parseInt(e.target.value) || 7)}
                    min={1}
                    max={30}
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Nonce (Sec)</label>
                  <input
                    type="number"
                    value={nonceIntervalSeconds}
                    onChange={e => setNonceIntervalSeconds(parseInt(e.target.value) || 30)}
                    min={10}
                    max={300}
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#6B7280] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-[#00F0FF]/15 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Issuing Licence...' : 'Approve & Issue Licence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Licence Token Inspector */}
      {selectedLicense && (
        <div className="fixed inset-0 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D121F] border border-[#1E2638] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLicense(null)}
              className="absolute right-4 top-4 text-[#6B7280] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-[#00F0FF]" />
              Activation Licence Token (.tflic)
            </h2>
            <p className="text-xs text-[#6B7280] mb-4 font-mono">
              Deployment ID: {selectedLicense.id}
            </p>

            <pre className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] font-mono text-xs text-[#00F0FF] overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    license_id: selectedLicense.licenseKey,
    deployment_id: selectedLicense.id,
    model_id: selectedLicense.modelId,
    device_id: selectedLicense.deviceId,
    device_serial: selectedLicense.deviceSerial,
    expires_at: selectedLicense.expiresAt,
    policies: {
      max_offline_days: selectedLicense.maxOfflineDays,
      nonce_challenge_interval_sec: selectedLicense.nonceIntervalSeconds,
      replay_prevention: "ENABLED"
    },
    signed_issuer: "CN=TFrenzy Licensing Authority v2, O=TFrenzy Security"
  },
  null,
  2
)}
            </pre>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLicense(null)}
                className="bg-[#111625] hover:bg-[#151C2E] text-white text-xs font-semibold py-2.5 px-5 rounded-xl border border-[#1E2638] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

