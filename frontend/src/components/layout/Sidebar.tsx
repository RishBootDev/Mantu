import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  KeyRound,
  Webhook,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge, BadgeVariant } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
  badgeVariant?: BadgeVariant;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { merchantStatus, kycStatus, onboardingComplete } = useAuth();

  const isKycApproved = onboardingComplete && merchantStatus === 'ACTIVE';

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          label: 'Dashboard',
          to: '/dashboard',
          icon: LayoutDashboard,
          disabled: !isKycApproved,
        },
      ],
    },
    {
      title: 'PAYMENTS & ORDERS',
      items: [
        {
          label: 'Transactions',
          to: '/transactions',
          icon: ArrowLeftRight,
          disabled: !isKycApproved,
        },
      ],
    },
    {
      title: 'DEVELOPERS',
      items: [
        {
          label: 'API Keys',
          to: '/developers/api-keys',
          icon: KeyRound,
          disabled: !isKycApproved,
        },
        {
          label: 'Webhooks',
          to: '/developers/webhooks',
          icon: Webhook,
          disabled: !isKycApproved,
        },
      ],
    },
    {
      title: 'ACCOUNT & COMPLIANCE',
      items: [
        {
          label: 'KYC Verification',
          to: isKycApproved ? '/kyc-verified' : '/onboarding/kyc',
          icon: FileCheck,
          badge: kycStatus === 'APPROVED' ? 'Verified' : 'Action Required',
          badgeVariant: kycStatus === 'APPROVED' ? 'success' : 'warning',
        },
      ],
    },
  ];

  return (
    <>
      {                    }
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-mantu-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand wordmark */}
        <div className="h-[72px] px-5 border-b border-mantu-border flex items-center">
          <div className="flex flex-col leading-none select-none gap-[6px]">
            {/* "Mantu" — crisp italic serif with vibrant multi-colour gradient */}
            <span
              className="mantu-wordmark"
              style={{ fontSize: '1.9rem', letterSpacing: '-0.015em', lineHeight: 1.05 }}
            >
              Mantu
            </span>
            {/* "Payment Gateway" — Space Grotesk, spaced caps */}
            <span
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontWeight: 500,
                fontSize: '0.6rem',
                letterSpacing: '0.26em',
                color: '#475569',
                textTransform: 'uppercase',
                lineHeight: 1,
                paddingLeft: '0.06em',
              }}
            >
              Payment&nbsp;Gateway
            </span>
          </div>
        </div>

        {                                }
        {!isKycApproved && (
          <div className="mx-3 my-3 p-3 rounded bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Onboarding Incomplete
            </div>
            <p className="text-[11px] text-amber-800 mt-1 leading-snug">
              Complete KYC submission to unlock live orders, API keys & payments.
            </p>
            <NavLink
              to="/onboarding/kyc"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 underline hover:text-amber-950"
            >
              Go to KYC Submission <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>
        )}

        {                     }
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 text-[11px] font-semibold text-mantu-muted tracking-wider mb-2">
                {group.title}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  if (item.disabled) {
                    return (
                      <li key={item.to}>
                        <div
                          title="Locked until KYC Approval"
                          className="flex items-center justify-between px-3 py-2 rounded text-xs text-slate-400 cursor-not-allowed select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 opacity-50" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">Locked</span>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-mantu-accent-subtle text-mantu-accent font-semibold'
                              : 'text-mantu-text hover:bg-slate-50'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge variant={item.badgeVariant} className="text-[10px] py-0 px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

      </aside>
    </>
  );
};
