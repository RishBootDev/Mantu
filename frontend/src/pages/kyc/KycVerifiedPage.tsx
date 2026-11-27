import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kycApi } from '../../api/kyc';
import { KycOnboardingResponse } from '../../types/api';
import { Button } from '../../components/common/Button';

export const KycVerifiedPage: React.FC = () => {
  const { businessName, email } = useAuth();
  const navigate = useNavigate();
  const [kycData, setKycData] = useState<KycOnboardingResponse | null>(null);

  useEffect(() => {
    kycApi.getStatus().then(setKycData).catch(() => {});
  }, []);

  const docs = kycData?.uploadedDocuments || (kycData as any)?.documents || [];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6">
      <div className="kyc-verified-card max-w-lg w-full bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 shadow-xl overflow-hidden">
        {/* Top emerald accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

        <div className="p-8 text-center">
          {/* Animated verification emblem */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" style={{ animationDuration: '2.4s' }} />
            <span className="absolute inset-2 rounded-full bg-emerald-400/20 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path className="kyc-check-path" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Status pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Compliance Approved
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Your KYC is Verified
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
            All mandatory compliance checks for{' '}
            <span className="font-semibold text-slate-800">{businessName || 'your business'}</span>{' '}
            {email ? <span className="font-mono text-[11px] text-slate-500">({email})</span> : null}{' '}
            are complete. Live payments, API keys, and webhooks are fully enabled.
          </p>

          {/* Verified checkpoints */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 text-left">
            {[
              'Identity & PAN Verified',
              'Business Registration',
              'Bank Settlement Active',
              `Documents (${docs.length > 0 ? docs.length : 4}/4 Approved)`,
            ].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs font-medium text-emerald-900"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Merchant Status: <strong className="text-emerald-700">ACTIVE</strong></span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
