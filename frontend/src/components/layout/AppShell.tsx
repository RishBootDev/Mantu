import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Get nice page title from route
  const getPageTitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Merchant Dashboard';
    if (path.includes('/transactions')) return 'Transactions & Orders';
    if (path.includes('/risk-monitoring')) return 'Risk & ML Anomaly Detection';
    if (path.includes('/developers/api-keys')) return 'API Keys Management';
    if (path.includes('/developers/webhooks')) return 'Webhooks Configuration';
    if (path.includes('/onboarding/kyc')) return 'Merchant KYC Onboarding';
    return 'Mantu Gateway';
  };

  return (
    <div className="min-h-screen bg-mantu-bg flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
