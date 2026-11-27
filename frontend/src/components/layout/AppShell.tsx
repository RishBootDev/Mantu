import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [location.pathname]);

                                   
  const getPageTitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Merchant Dashboard';
    if (path.includes('/transactions')) return 'Transactions & Orders';
    if (path.includes('/developers/api-keys')) return 'API Keys Management';
    if (path.includes('/developers/webhooks')) return 'Webhooks Configuration';
    if (path.includes('/onboarding/kyc') || path.includes('/kyc-verified')) return 'KYC Verification';
    return 'Mantu Gateway';
  };

  return (
    <div className="min-h-screen bg-mantu-bg flex">
      {                        }
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {                       }
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 relative">
        {/* Background video for the right-side dashboard area (plays once per route) */}
        <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-0 pointer-events-none overflow-hidden">
          <video
            ref={videoRef}
            src="/background_merchant.mp4"
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/45" />
        </div>

        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />
        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
