import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ModelsPage } from './pages/ModelsPage';
import { DevicesPage } from './pages/DevicesPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { AttackLabPage } from './pages/AttackLabPage';
import { JetsonAgentTerminalPage } from './pages/JetsonAgentTerminalPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activeTab } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'models':
        return <ModelsPage />;
      case 'devices':
        return <DevicesPage />;
      case 'deployments':
        return <DeploymentsPage />;
      case 'attack_lab':
        return <AttackLabPage />;
      case 'agent_terminal':
        return <JetsonAgentTerminalPage />;
      case 'audit_logs':
        return <AuditLogsPage />;
      case 'architecture':
        return <ArchitecturePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#9CA3AF] flex flex-col font-sans selection:bg-[#00F0FF]/30 selection:text-[#00F0FF]">
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

