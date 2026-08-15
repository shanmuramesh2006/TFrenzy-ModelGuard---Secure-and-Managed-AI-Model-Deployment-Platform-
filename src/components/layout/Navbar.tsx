import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, LogOut, Bell, User, ChevronDown, Menu, X, Activity, LockKeyhole } from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const { user, logout, switchRole } = useAuth();
  const { agentState, auditLogs } = useApp();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const criticalLogs = auditLogs.filter(l => l.severity === 'critical');

  return (
    <header className="h-16 bg-[#0B0E17]/90 border-b border-[#1E2638] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
      {/* Brand Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-[#9CA3AF] hover:text-white hover:bg-[#151C2E] rounded-lg transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Icon & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#2563EB] to-[#00F0FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#00F0FF]/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#07090E] stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              ModelGuard
            </span>
            <span className="text-[9px] text-[#00F0FF] block font-mono uppercase tracking-widest font-semibold -mt-0.5">
              Secure. Deploy. Monitor.
            </span>
          </div>
        </div>
      </div>

      {/* Center status indicator */}
      <div className="hidden lg:flex items-center gap-4 bg-[#111625] border border-[#1E2638] px-4 py-1.5 rounded-full text-xs font-mono shadow-inner">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${agentState.isRunning ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-[#6B7280]'}`} />
          <span className="text-[#9CA3AF] text-[11px] uppercase">
            Runtime: <span className={agentState.isRunning ? 'text-emerald-400 font-bold' : 'text-[#6B7280]'}>
              {agentState.isRunning ? 'INFERENCE_ACTIVE' : 'READY'}
            </span>
          </span>
        </div>
        <div className="h-3 w-px bg-[#1E2638]" />
        <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px]">
          <span>UPTIME:</span> <span className="text-white font-semibold">142h 33m</span>
        </div>
        <div className="h-3 w-px bg-[#1E2638]" />
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[#6B7280]">mTLS:</span> <span className="text-[#00F0FF] font-bold">LEVEL_5_ROOT</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        
        {/* Alerts Badge */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            title="System Security Notifications"
            className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#2D3A54] transition-all relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {criticalLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_8px_#ef4444]">
                {criticalLogs.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Popover */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0F1423] border border-[#1E2638] rounded-xl shadow-2xl py-2 z-50 font-mono text-xs">
              <div className="px-3.5 py-2 border-b border-[#1E2638] flex items-center justify-between">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">Security Alerts</span>
                <span className="text-[10px] text-red-400 font-bold">{criticalLogs.length} Critical</span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-[#1E2638]">
                {criticalLogs.length === 0 ? (
                  <div className="p-3 text-center text-[#6B7280] text-[11px]">No critical security flags</div>
                ) : (
                  criticalLogs.map(log => (
                    <div key={log.id} className="p-2.5 hover:bg-[#151C2E] transition-colors">
                      <div className="text-red-400 font-bold text-[10px]">{log.event}</div>
                      <div className="text-[#9CA3AF] text-[10px] truncate">{log.details}</div>
                      <div className="text-[#6B7280] text-[9px] mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 bg-[#111625] border border-[#1E2638] px-3 py-1.5 rounded-xl text-xs text-[#9CA3AF] hover:border-[#2D3A54] transition-all font-mono cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-bold uppercase text-white hidden sm:inline">{user?.role.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0F1423] border border-[#1E2638] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-[#1E2638] text-[10px] uppercase font-bold text-[#6B7280] tracking-wider font-mono">
                Switch Role Authority
              </div>
              <button
                onClick={() => { switchRole('admin'); setShowRoleDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#151C2E] transition-colors ${user?.role === 'admin' ? 'text-[#00F0FF] font-bold' : 'text-[#9CA3AF]'}`}
              >
                Platform Admin
              </button>
              <button
                onClick={() => { switchRole('security_auditor'); setShowRoleDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#151C2E] transition-colors ${user?.role === 'security_auditor' ? 'text-[#00F0FF] font-bold' : 'text-[#9CA3AF]'}`}
              >
                Security Auditor
              </button>
              <button
                onClick={() => { switchRole('field_operator'); setShowRoleDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#151C2E] transition-colors ${user?.role === 'field_operator' ? 'text-[#00F0FF] font-bold' : 'text-[#9CA3AF]'}`}
              >
                Edge Operator
              </button>
            </div>
          )}
        </div>

        {/* User avatar & logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1E2638]">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-white font-mono">{user?.name}</span>
            <span className="block text-[9px] text-emerald-400 font-mono font-semibold">SESSION_ACTIVE</span>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="w-9 h-9 rounded-xl bg-[#111625] border border-[#1E2638] flex items-center justify-center text-[#6B7280] hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

