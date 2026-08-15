import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Terminal,
  Play,
  Square,
  Cpu,
  CheckCircle2,
  HardDrive,
  Activity,
  Zap,
  Lock,
  RotateCcw
} from 'lucide-react';

export const JetsonAgentTerminalPage: React.FC = () => {
  const { devices, deployments, agentState, startAgentRuntime, stopAgentRuntime } = useApp();

  const activeDeployments = deployments.filter(d => d.status === 'active');
  const approvedDevices = devices.filter(d => d.status === 'approved');

  const selectedDev = devices.find(d => d.id === agentState.selectedDeviceId) || devices[0];
  const selectedDep = deployments.find(d => d.id === agentState.selectedDeploymentId) || deployments[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-[#1E2638]">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-mono">
            <Terminal className="w-5 h-5 text-[#00F0FF]" />
            TFrenzy Jetson Secure Runtime Agent Simulator
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Simulates the C++ Jetson Orin agent performing mTLS authentication, 2-Level activation key request, in-memory model decryption, and TensorRT CUDA engine loading.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono">
          {!agentState.isRunning ? (
            <button
              onClick={() => startAgentRuntime(selectedDev.id, selectedDep.id)}
              className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#00F0FF]/15 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current stroke-none" />
              <span>Boot Agent & Launch Model</span>
            </button>
          ) : (
            <button
              onClick={stopAgentRuntime}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
            >
              <Square className="w-4 h-4 fill-white stroke-none" />
              <span>Stop Agent Runtime</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Selector Bar */}
      <div className="glass-card border border-[#1E2638] p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
            Target Jetson Orin Device
          </label>
          <select
            value={selectedDev.id}
            onChange={e => startAgentRuntime(e.target.value, selectedDep.id)}
            disabled={agentState.isRunning}
            className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
          >
            {approvedDevices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.serialNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
            Model Deployment Binding
          </label>
          <select
            value={selectedDep.id}
            onChange={e => startAgentRuntime(selectedDev.id, e.target.value)}
            disabled={agentState.isRunning}
            className="w-full bg-[#07090E] border border-[#1E2638] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
          >
            {activeDeployments.map(dep => (
              <option key={dep.id} value={dep.id}>
                {dep.modelName} -&gt; {dep.deviceName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Runtime Live Verification Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="glass-card border border-[#1E2638] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-[#00F0FF]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7280] block">mTLS Auth</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {agentState.currentStep !== 'idle' ? 'Verified (RSA-3072)' : 'Ready'}
            </span>
          </div>
        </div>

        <div className="glass-card border border-[#1E2638] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7280] block">CUDA Buffer</span>
            <span className="text-xs font-bold text-[#00F0FF] font-mono">
              {agentState.memoryDecryptedBufferAllocated ? 'In RAM (Pinned)' : 'Unallocated'}
            </span>
          </div>
        </div>

        <div className="glass-card border border-[#1E2638] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-amber-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Filesystem</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              0 Bytes Plaintext
            </span>
          </div>
        </div>

        <div className="glass-card border border-[#1E2638] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Inference Speed</span>
            <span className="text-xs font-bold text-white font-mono">
              {agentState.liveFps > 0 ? `${agentState.liveFps} FPS` : '0 FPS'}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="bg-[#07090E] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#111625] px-4 py-3 border-b border-[#1E2638] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-[#6B7280] ml-2">
              root@jetson-orin-nano-8gb:/opt/tfrenzy/agent# ./tfrenzy-secure-runtime --dep {selectedDep.id}
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#00F0FF] bg-[#07090E] px-2.5 py-1 rounded-md border border-[#1E2638]">
            JetPack 5.1.2 • CUDA 11.4
          </span>
        </div>

        <div className="p-5 font-mono text-xs space-y-2 h-96 overflow-y-auto text-[#9CA3AF]">
          {agentState.terminalLogs.map((log, idx) => (
            <p
              key={idx}
              className={
                log.includes('Step') || log.includes('RUNNING')
                  ? 'text-[#00F0FF] font-bold'
                  : log.includes('OK') || log.includes('Verified') || log.includes('CLEAN')
                  ? 'text-emerald-400 font-bold'
                  : log.includes('ERROR') || log.includes('FAILED')
                  ? 'text-red-400 font-bold'
                  : 'text-[#9CA3AF]'
              }
            >
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

