import React, { useState } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEnvironment } from '../../context/EnvironmentContext';
import { Badge } from '../common/Badge';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const { email, businessName, merchantStatus, kycStatus, logout } = useAuth();
  const { environment, toggleEnvironment, isTestMode } = useEnvironment();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-mantu-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-mantu-muted hover:text-mantu-text p-1.5 rounded hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-mantu-text hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Status Pill */}
        <button
          onClick={toggleEnvironment}
          className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
            isTestMode
              ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Click to toggle Test/Live mode"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isTestMode ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span className="font-mono">{environment} MODE</span>
        </button>

        {/* KYC Status indicator */}
        <Badge
          variant={kycStatus === 'APPROVED' ? 'success' : 'warning'}
          dot
          className="hidden md:inline-flex"
        >
          {kycStatus === 'APPROVED' ? 'Merchant Active' : `KYC: ${kycStatus}`}
        </Badge>

        {/* Notification Bell */}
        <button
          className="relative text-mantu-muted hover:text-mantu-text p-2 rounded hover:bg-slate-100 transition-colors"
          title="Anomaly Alerts & Gateway Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-mantu-text leading-tight truncate max-w-[120px]">
                {businessName}
              </div>
              <div className="text-[10px] text-mantu-muted font-mono leading-tight">
                {email}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-mantu-muted" />
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-mantu-border rounded shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-mantu-border">
                  <p className="text-xs font-semibold text-mantu-text">{businessName}</p>
                  <p className="text-[11px] text-mantu-muted font-mono truncate">{email}</p>
                  <div className="mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Status: {merchantStatus}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
