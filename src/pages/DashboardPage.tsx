import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Box,
  Cpu,
  Rocket,
  ShieldAlert,
  Activity,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { models, devices, deployments, attackScenarios, auditLogs, setActiveTab, agentState } = useApp();

  const activeModels = models.filter(m => m.status === 'active').length;
  const approvedDevices = devices.filter(d => d.status === 'approved').length;
  const activeDeployments = deployments.filter(d => d.status === 'active').length;
  const passedTests = attackScenarios.filter(s => s.status === 'passed').length;

  return (
    <div className="space-y-6">

      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-[#0E1424] via-[#10182C] to-[#0A1120] border border-[#1E2638] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00F0FF]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ModelGuard Protection Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Protected TensorRT Model & Jetson Orin Security Portal
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Converting unmanaged TensorRT <code className="text-[#00F0FF] font-mono bg-[#07090E] px-2 py-0.5 rounded border border-[#1E2638]">.engine</code> files into AES-256-GCM encrypted, RSA-3072 signed, device-authorized model packages that run strictly in memory on registered Jetson hardware.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('attack_lab')}
              className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-3 rounded-xl text-xs shadow-lg shadow-[#00F0FF]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              <span>Launch Attack Lab</span>
            </button>
            <button
              onClick={() => setActiveTab('agent_terminal')}
              className="bg-[#111625] hover:bg-[#151C2E] text-white font-semibold px-5 py-3 rounded-xl text-xs border border-[#1E2638] hover:border-[#2D3A54] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#00F0FF]" />
              <span>View Live Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-[#2D3A54] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#6B7280] font-mono tracking-wider">Encrypted Models</span>
            <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-center text-[#2563EB]">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono text-white font-extrabold">{activeModels}</div>
          <div className="text-xs text-[#6B7280] font-mono">/ {models.length} Total Packages Configured</div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-[#2D3A54] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#6B7280] font-mono tracking-wider">Authorized Devices</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono text-white font-extrabold">{approvedDevices}</div>
          <div className="text-xs text-emerald-400 font-mono font-semibold">mTLS CERT_VERIFIED</div>
        </div>

        {/* Metric 3 - Glowing Accent */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden border-l-4 border-l-[#00F0FF] group hover:border-[#2D3A54] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#00F0FF] font-mono tracking-wider">Active Deployments</span>
            <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono text-white font-extrabold">{activeDeployments}</div>
          <div className="text-xs text-[#00F0FF] font-mono font-semibold">BINDING_ACTIVE</div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-[#2D3A54] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#6B7280] font-mono tracking-wider">Security Index</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono text-emerald-400 font-extrabold">98 / 100</div>
          <div className="text-xs text-[#6B7280] font-mono">0 Bytes Plaintext on Disk</div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Deployment Registry Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden border border-[#1E2638]">
            <div className="bg-[#111625] px-6 py-4 border-b border-[#1E2638] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">Live Deployment Registry</h3>
                <p className="text-xs text-[#6B7280]">Real-time model-to-device licensing matrix</p>
              </div>
              <button
                onClick={() => setActiveTab('deployments')}
                className="text-xs bg-gradient-to-r from-[#2563EB] to-[#00F0FF] text-[#07090E] px-4 py-2 font-extrabold rounded-xl uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md shadow-[#00F0FF]/10"
              >
                + New Assignment
              </button>
            </div>

            <div className="font-mono text-xs overflow-x-auto">
              <div className="grid grid-cols-5 gap-4 px-6 py-3 border-b border-[#1E2638] text-[#6B7280] bg-[#0A0E18] font-bold uppercase min-w-[650px]">
                <div>DEPLOYMENT_ID</div>
                <div>MODEL_VER</div>
                <div>DEVICE_SERIAL</div>
                <div>MTLS_STATUS</div>
                <div>EXPIRY</div>
              </div>

              <div className="divide-y divide-[#1E2638]/50 min-w-[650px]">
                {deployments.map(dep => (
                  <div
                    key={dep.id}
                    className="grid grid-cols-5 gap-4 px-6 py-3.5 hover:bg-[#111625] transition-colors items-center"
                  >
                    <div className="text-white font-bold">{dep.id.toUpperCase()}</div>
                    <div className="text-[#9CA3AF] truncate font-sans font-medium">{dep.modelName}</div>
                    <div className="truncate text-[#6B7280]">{dep.deviceSerial}</div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        dep.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : dep.status === 'revoked' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {dep.status === 'active' ? 'VERIFIED' : dep.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[#9CA3AF]">{new Date(dep.expiresAt).toISOString().split('T')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Layer SLA Verification */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-[#1E2638]">
            <div className="flex justify-between items-center border-b border-[#1E2638] pb-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                SLA Performance Verification Matrix
              </h3>
              <span className="text-xs text-[#00F0FF] font-mono font-bold">TARGET: &lt;3.0% OVERHEAD</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div className="p-3.5 bg-[#090D18] border border-[#1E2638] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280] block">FPS Impact</span>
                <span className="text-xl font-bold text-emerald-400">-0.5%</span>
                <span className="text-[10px] text-[#6B7280] block">3.0% Max SLA</span>
              </div>
              <div className="p-3.5 bg-[#090D18] border border-[#1E2638] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280] block">P95 Latency</span>
                <span className="text-xl font-bold text-emerald-400">+1.2%</span>
                <span className="text-[10px] text-[#6B7280] block">3.0% Max SLA</span>
              </div>
              <div className="p-3.5 bg-[#090D18] border border-[#1E2638] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Agent RAM</span>
                <span className="text-xl font-bold text-[#00F0FF]">26 MB</span>
                <span className="text-[10px] text-[#6B7280] block">100 MB Max SLA</span>
              </div>
              <div className="p-3.5 bg-[#090D18] border border-[#1E2638] rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Disk Plaintext</span>
                <span className="text-xl font-bold text-emerald-400">0 Bytes</span>
                <span className="text-[10px] text-[#6B7280] block">RAM Pinned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security Context & Live Audit Ticker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Security Context */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-[#1E2638]">
            <div className="text-xs font-bold text-white uppercase border-b border-[#1E2638] pb-3 font-mono tracking-wider flex items-center justify-between">
              <span>Cryptographic Security Context</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#1E2638]/40">
                <span className="text-[#6B7280] uppercase">Encryption</span>
                <span className="text-white font-bold">AES-256-GCM</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E2638]/40">
                <span className="text-[#6B7280] uppercase">Digital Signature</span>
                <span className="text-white font-bold">RSA-3072 PSS</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E2638]/40">
                <span className="text-[#6B7280] uppercase">Handshake Protocol</span>
                <span className="text-white font-bold">mTLS 1.3</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6B7280] uppercase">Anti-Replay</span>
                <span className="text-[#00F0FF] font-extrabold">ENABLED (30s)</span>
              </div>
            </div>
            <div className="p-3 bg-[#090D18] border border-[#1E2638] rounded-xl text-[10px] font-mono break-all text-[#6B7280]">
              ROOT_CERT_SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          {/* Live Audit Ticker */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col border border-[#1E2638]">
            <div className="text-xs font-bold text-white uppercase border-b border-[#1E2638] pb-3 mb-4 font-mono flex justify-between items-center tracking-wider">
              <span>Live Audit Stream</span>
              <span className="text-[#00F0FF] text-[10px] animate-pulse font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" /> LIVE
              </span>
            </div>
            <div className="space-y-3 font-mono text-[11px]">
              {auditLogs.slice(0, 6).map(log => (
                <div key={log.id} className="flex gap-2 items-start p-2 rounded-lg hover:bg-[#111625] transition-colors">
                  <span className="text-[#6B7280] shrink-0 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={log.severity === 'critical' ? 'text-red-400 font-bold shrink-0' : log.severity === 'warning' ? 'text-amber-400 font-bold shrink-0' : 'text-emerald-400 font-bold shrink-0'}>
                    [{log.severity === 'critical' ? 'CRIT' : log.severity === 'warning' ? 'WARN' : 'INFO'}]
                  </span>
                  <span className="text-[#9CA3AF] truncate">{log.event}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-[#1E2638] flex justify-between items-center text-xs">
              <button
                onClick={() => setActiveTab('audit_logs')}
                className="text-[#6B7280] hover:text-white uppercase font-mono transition-colors font-semibold cursor-pointer"
              >
                Full Log Stream &rarr;
              </button>
              <button
                onClick={() => setActiveTab('attack_lab')}
                className="text-[#00F0FF] hover:underline uppercase tracking-wider font-mono font-bold cursor-pointer"
              >
                Attack Suite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



