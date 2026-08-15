import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttackTestScenario } from '../types';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  Lock,
  RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { INITIAL_PERFORMANCE_METRICS } from '../data/mockData';

export const AttackLabPage: React.FC = () => {
  const { attackScenarios, runAttackTest } = useApp();

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<AttackTestScenario | null>(attackScenarios[0]);

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const scenario of attackScenarios) {
      await runAttackTest(scenario.id);
    }
    setIsRunningAll(false);
  };

  const passedCount = attackScenarios.filter(s => s.status === 'passed').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-[#1E2638]">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2 font-mono">
            <ShieldAlert className="w-5 h-5 text-[#00F0FF]" />
            Security Attack & Misuse Simulation Lab
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Automated test suite validating the 8 security guarantees of TFrenzy ModelGuard against copying, tampering, replay attacks, expired licences, and filesystem inspection.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunningAll}
          className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-5 py-3 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 font-mono shadow-lg shadow-[#00F0FF]/15 cursor-pointer"
        >
          {isRunningAll ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Executing Attack Matrix...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current stroke-none" />
              <span>Run Security Audit Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Passed Banner */}
      <div className="glass-card rounded-2xl p-5 border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-emerald-400 font-extrabold text-base shadow-inner">
            {passedCount}/{attackScenarios.length}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Security Guarantees Verified</h3>
            <p className="text-[11px] text-[#6B7280]">All attacks rejected by mTLS, RSA-3072, AES-256-GCM, and 2-Level Activation</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono text-[#6B7280]">
          <div>P95 Latency: <span className="text-emerald-400 font-bold">+1.2%</span></div>
          <div>FPS Impact: <span className="text-emerald-400 font-bold">-0.5%</span></div>
          <div>Plaintext on Disk: <span className="text-emerald-400 font-bold">0 Bytes</span></div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 font-mono">
          {attackScenarios.map(scenario => {
            const isSelected = selectedScenario?.id === scenario.id;
            const isPassed = scenario.status === 'passed';
            const isRunning = scenario.status === 'running';

            return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#111625] border-[#00F0FF] shadow-lg shadow-[#00F0FF]/5'
                    : 'glass-card border-[#1E2638] hover:border-[#2D3A54]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[#07090E] text-[#00F0FF] border border-[#1E2638]">
                        {scenario.code}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">{scenario.category}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">{scenario.title}</h4>
                  </div>

                  <div className="shrink-0">
                    {isRunning ? (
                      <div className="w-5 h-5 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
                    ) : isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          runAttackTest(scenario.id);
                        }}
                        title="Run This Test"
                        className="p-1.5 rounded-lg bg-[#111625] hover:bg-[#151C2E] text-white border border-[#1E2638] cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-[#00F0FF] fill-current stroke-none" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-[#6B7280] mt-2 line-clamp-2 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Test Output Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedScenario && (
            <div className="glass-card border border-[#1E2638] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4 font-mono">
                <div>
                  <span className="text-xs text-[#00F0FF] font-bold">{selectedScenario.code} • {selectedScenario.category}</span>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">{selectedScenario.title}</h3>
                </div>

                <button
                  onClick={() => runAttackTest(selectedScenario.id)}
                  disabled={selectedScenario.status === 'running'}
                  className="bg-gradient-to-r from-[#2563EB] to-[#00F0FF] hover:opacity-90 text-[#07090E] font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 uppercase tracking-wider cursor-pointer shadow-md shadow-[#00F0FF]/15"
                >
                  <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                  <span>Execute Test</span>
                </button>
              </div>

              {/* Description & Expected Outcome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#07090E] p-3.5 rounded-xl border border-[#1E2638]">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block mb-1">Attack Vector</span>
                  <p className="text-[#9CA3AF] leading-relaxed">{selectedScenario.description}</p>
                </div>
                <div className="bg-[#07090E] p-3.5 rounded-xl border border-[#1E2638]">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block mb-1">Expected Protection Outcome</span>
                  <p className="text-emerald-400 font-bold leading-relaxed">{selectedScenario.expectedOutcome}</p>
                </div>
              </div>

              {/* Console Logs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <Terminal className="w-4 h-4 text-[#00F0FF]" /> Execution Terminal Log
                  </span>
                  {selectedScenario.durationMs && (
                    <span className="text-[10px] font-mono text-[#6B7280]">Duration: {selectedScenario.durationMs}ms</span>
                  )}
                </div>

                <div className="bg-[#07090E] p-4 rounded-xl border border-[#1E2638] font-mono text-xs text-[#9CA3AF] space-y-1.5 max-h-64 overflow-y-auto">
                  {selectedScenario.logs.length === 0 ? (
                    <p className="text-[#6B7280] italic">No execution logs yet. Click "Execute Test" to run.</p>
                  ) : (
                    selectedScenario.logs.map((log, idx) => (
                      <p
                        key={idx}
                        className={
                          log.includes('DENIED') || log.includes('SUCCESS')
                            ? 'text-emerald-400 font-bold'
                            : log.includes('ATTACK')
                            ? 'text-amber-400 font-bold'
                            : 'text-[#9CA3AF]'
                        }
                      >
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

