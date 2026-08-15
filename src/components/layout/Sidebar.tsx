import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Box,
  Cpu,
  Rocket,
  ShieldAlert,
  Terminal,
  FileText,
  Network,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, models, devices, deployments, auditLogs } = useApp();

  const criticalLogs = auditLogs.filter(l => l.severity === 'critical').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'models',
      label: 'Models & Packaging',
      icon: Box,
      badge: models.length
    },
    {
      id: 'devices',
      label: 'Jetson Devices (mTLS)',
      icon: Cpu,
      badge: devices.length
    },
    {
      id: 'deployments',
      label: 'Deployments & Licensing',
      icon: Rocket,
      badge: deployments.length
    },
    {
      id: 'attack_lab',
      label: 'Attack Simulation Suite',
      icon: ShieldAlert,
      badge: '8 Tests',
      highlight: true
    },
    {
      id: 'agent_terminal',
      label: 'Jetson Secure Agent',
      icon: Terminal,
      badge: 'Live'
    },
    {
      id: 'audit_logs',
      label: 'Security Audit Logs',
      icon: FileText,
      badge: criticalLogs > 0 ? `${criticalLogs} alert` : null
    },
    {
      id: 'architecture',
      label: 'Architecture & Keys',
      icon: Network,
      badge: null
    }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6">
      <div className="px-4 space-y-2">
        {/* Mobile Close Header */}
        {onCloseMobile && (
          <div className="flex items-center justify-between pb-4 border-b border-[#1E2638] md:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00F0FF]" />
              <span className="font-bold text-white text-sm">ModelGuard Navigation</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-[#6B7280] hover:text-white rounded-lg hover:bg-[#151C2E]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="text-[10px] uppercase tracking-widest text-[#6B7280] mb-3 px-2 font-mono font-bold">
          Platform Controls
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30 font-bold shadow-lg shadow-[#00F0FF]/10'
                  : 'text-[#9CA3AF] hover:bg-[#151C2E] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' : 'bg-[#6B7280]'}`} />
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F0FF]' : 'text-[#6B7280]'}`} />
                <span className="font-medium">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    item.highlight
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                      : isActive
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-extrabold'
                      : 'bg-[#111625] text-[#6B7280] border border-[#1E2638]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Footer Info */}
      <div className="p-3.5 border border-[#1E2638] bg-[#090D18] mx-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#111625] border border-[#1E2638] flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white font-mono font-bold">RUNTIME_PROTECTED</span>
            <span className="text-[9px] text-[#00F0FF] font-mono">AES-256 / RSA-3072</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-[#0B0E17] border-r border-[#1E2638] shrink-0 hidden md:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#07090E]/80 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-[#0B0E17] border-r border-[#1E2638] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

