import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JetsonDevice } from '../types';
import {
  Cpu,
  Plus,
  CheckCircle2,
  AlertOctagon,
  Eye,
  X,
  FileBadge,
  HardDrive,
  Globe,
  Activity,
  ShieldAlert
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const { devices, registerDevice, approveDevice, revokeDevice } = useApp();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCertDevice, setSelectedCertDevice] = useState<JetsonDevice | null>(null);

  // Form
  const [deviceName, setDeviceName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [jetpackVersion, setJetpackVersion] = useState('JetPack 5.1.2 (L4T R35.4.1)');
  const [location, setLocation] = useState('Building B - Gate Node');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName) return;

    setIsSubmitting(true);
    await registerDevice({
      name: deviceName,
      serialNumber,
      macAddress,
      jetpackVersion,
      location
    });

    setIsSubmitting(false);
    setIsRegisterModalOpen(false);
    setDeviceName('');
    setSerialNumber('');
    setMacAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-[#1E2638]">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00F0FF]" />
            Jetson Device Registry & Mutual TLS (mTLS) Security
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Every NVIDIA Jetson Orin Nano device holds a unique hardware-bound certificate and RSA-3072 key pair for mTLS authentication.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 font-mono shadow-lg shadow-[#00F0FF]/15 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register Jetson Device</span>
        </button>
      </div>

      {/* Devices List */}
      <div className="space-y-4">
        {devices.map(device => {
          const isApproved = device.status === 'approved';
          const isRevoked = device.status === 'revoked';
          const isPending = device.status === 'pending';

          return (
            <div
              key={device.id}
              className={`glass-card rounded-2xl p-6 transition-all border ${
                isRevoked
                  ? 'border-red-500/40 bg-red-950/10'
                  : isPending
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-[#1E2638] hover:border-[#2D3A54]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Info block */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-[#00F0FF] shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-extrabold text-white">{device.name}</h3>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isRevoked
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {device.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                        ID: <strong className="text-white">{device.id}</strong> | SERIAL: {device.serialNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs text-[#6B7280] font-mono border-t border-[#1E2638]/50">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#6B7280]">MAC / IP</span>
                      <span className="text-white font-medium">{device.macAddress} ({device.ipAddress})</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#6B7280]">JetPack OS</span>
                      <span className="text-white font-medium">{device.jetpackVersion}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#6B7280]">Fuse Hash</span>
                      <span className="text-[#00F0FF] font-semibold truncate block">{device.hardwareFuseHash}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-[#6B7280]">Cert Expiry</span>
                      <span className="text-white font-medium">{new Date(device.certExpiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2.5 border-t lg:border-t-0 lg:border-l border-[#1E2638] pt-4 lg:pt-0 lg:pl-5 shrink-0 font-mono">
                  <button
                    onClick={() => setSelectedCertDevice(device)}
                    className="bg-[#111625] hover:bg-[#151C2E] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all border border-[#1E2638] hover:border-[#2D3A54] flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileBadge className="w-4 h-4 text-[#00F0FF]" />
                    <span>VIEW CERT</span>
                  </button>

                  {isPending && (
                    <button
                      onClick={() => approveDevice(device.id)}
                      className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00F0FF]/15"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE mTLS</span>
                    </button>
                  )}

                  {!isRevoked && (
                    <button
                      onClick={() => revokeDevice(device.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>REVOKE</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Device Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D121F] border border-[#1E2638] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute right-4 top-4 text-[#6B7280] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-[#00F0FF]" />
              Register Jetson Orin Nano Device
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-5">
              Registers device MAC and generates x509 device certificate for mutual TLS authentication.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Device Label / Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  placeholder="e.g. Jetson Orin Nano 8GB (Production Gate #1)"
                  required
                  className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Hardware Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="1423822091238"
                    required
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Ethernet / Wi-Fi MAC Address</label>
                  <input
                    type="text"
                    value={macAddress}
                    onChange={e => setMacAddress(e.target.value)}
                    placeholder="48:B0:2D:1A:89:FE"
                    required
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">JetPack OS Version</label>
                  <input
                    type="text"
                    value={jetpackVersion}
                    onChange={e => setJetpackVersion(e.target.value)}
                    placeholder="JetPack 5.1.2"
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Physical Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Building A - Gate"
                    className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#6B7280] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-[#00F0FF]/15 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? 'Issuing Certificate...' : 'Register & Issue Device Cert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {selectedCertDevice && (
        <div className="fixed inset-0 bg-[#07090E]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D121F] border border-[#1E2638] rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCertDevice(null)}
              className="absolute right-4 top-4 text-[#6B7280] hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-1">
              <FileBadge className="w-5 h-5 text-[#00F0FF]" />
              x509 Mutual TLS Device Certificate
            </h2>
            <p className="text-xs text-[#6B7280] mb-4 font-mono">
              Device: {selectedCertDevice.name} ({selectedCertDevice.id})
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] space-y-1.5 text-[#9CA3AF]">
                <p><strong className="text-[#00F0FF]">Subject:</strong> CN={selectedCertDevice.id}, O=TFrenzy Device Fleet, MAC={selectedCertDevice.macAddress}</p>
                <p><strong className="text-[#00F0FF]">Issuer:</strong> {selectedCertDevice.certIssuer}</p>
                <p><strong className="text-[#00F0FF]">SHA-256 Fingerprint:</strong> <span className="text-emerald-400 font-bold">{selectedCertDevice.deviceCertFingerprint}</span></p>
                <p><strong className="text-[#00F0FF]">Hardware Fuse Root:</strong> {selectedCertDevice.hardwareFuseHash}</p>
                <p><strong className="text-[#00F0FF]">Valid Until:</strong> {new Date(selectedCertDevice.certExpiresAt).toUTCString()}</p>
              </div>

              <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] text-[#6B7280] overflow-x-auto text-[11px] leading-relaxed">
                {selectedCertDevice.publicKey}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedCertDevice(null)}
                className="bg-[#111625] hover:bg-[#151C2E] text-white text-xs font-semibold py-2.5 px-5 rounded-xl border border-[#1E2638] cursor-pointer"
              >
                Close Certificate Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

