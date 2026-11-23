import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kycApi } from '../../api/kyc';
import { KycOnboardingResponse, KycDocumentType } from '../../types/api';
import { DocumentUploadDropzone } from '../../components/kyc/DocumentUploadDropzone';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';

export const KycOnboardingPage: React.FC = () => {
  const { refreshKycStatus, logout, businessName, email } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [kycData, setKycData] = useState<KycOnboardingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchKyc = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const res = await kycApi.getStatus();
      setKycData(res);
      if (res.kycStatus === 'APPROVED' && res.onboardingComplete) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(
        err.response?.data?.errorDescription ||
        err.message ||
        'Unable to load KYC verification data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, []);

  const handleUpload = async (type: KycDocumentType, file: File) => {
    try {
      const updated = await kycApi.uploadDocument(type, file);
      setKycData(updated);
      await refreshKycStatus();
      showToast(`${type} document uploaded successfully`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.errorDescription || 'Upload failed.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const updated = await kycApi.submitForReview();
      setKycData(updated);
      await refreshKycStatus();
      showToast('KYC submitted for compliance review', 'success');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.errorDescription ||
          'Failed to submit KYC. Ensure all 4 mandatory files are uploaded.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mantu-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-mantu-muted font-mono">Loading verification profile...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !kycData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="h-16 px-6 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-mantu-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-mantu-text">MANTU</span>
              <span className="text-[10px] text-mantu-muted block uppercase tracking-wider font-semibold">Gateway</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-mantu-muted" />}
          >
            Sign Out
          </Button>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-card border border-rose-200 p-6 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to Load KYC Status</h3>
            <p className="text-xs text-slate-500 mb-6">{fetchError || 'No verification data received from server.'}</p>
            <div className="flex gap-3 justify-center">
              <Button size="sm" onClick={fetchKyc}>Retry</Button>
              <Button size="sm" variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const docs = kycData.uploadedDocuments || (kycData as any).documents || [];
  const uploadedMap = new Map(docs.map((d: any) => [d.documentType, d]));
  const totalRequired = 4;
  const currentCount = docs.length;
  const progressPercent = Math.min(100, Math.round((currentCount / totalRequired) * 100));
  const isReadOnly = kycData.kycStatus === 'UNDER_REVIEW' || kycData.kycStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation Bar with Brand & Logout */}
      <header className="h-16 px-6 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-mantu-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-mantu-text">MANTU</span>
            <span className="text-[10px] text-mantu-muted block uppercase tracking-wider font-semibold">Gateway</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-mantu-text truncate max-w-[180px]">
              {businessName || 'Merchant'}
            </div>
            <div className="text-[11px] text-mantu-muted font-mono truncate max-w-[180px]">
              {email}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-mantu-muted" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Centered Onboarding Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Merchant Compliance Onboarding
                </span>
              </div>
              <div>
                {kycData.kycStatus === 'APPROVED' && (
                  <Badge variant="success" dot className="text-xs py-1 px-2.5">
                    APPROVED (ACTIVE)
                  </Badge>
                )}
                {kycData.kycStatus === 'UNDER_REVIEW' && (
                  <Badge variant="accent" dot className="text-xs py-1 px-2.5">
                    UNDER REVIEW
                  </Badge>
                )}
                {kycData.kycStatus === 'DRAFT' && (
                  <Badge variant="warning" dot className="text-xs py-1 px-2.5">
                    PENDING VERIFICATION
                  </Badge>
                )}
                {kycData.kycStatus === 'REJECTED' && (
                  <Badge variant="error" dot className="text-xs py-1 px-2.5">
                    REVISION REQUIRED
                  </Badge>
                )}
                {kycData.kycStatus === 'WAITLISTED' && (
                  <Badge variant="warning" dot className="text-xs py-1 px-2.5">
                    WAITLISTED
                  </Badge>
                )}
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Verify your Business
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              To comply with payment regulations and unlock live gateway API keys, please upload the 4 mandatory business documents below.
            </p>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Verification Checklist</span>
                <span className="font-mono text-mantu-accent">{currentCount} of {totalRequired} Uploaded ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-mantu-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5">
            {/* Reviewer Note if any */}
            {kycData.reviewerNote && (
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-rose-900">Compliance Review Note:</h4>
                  <p className="text-xs text-rose-800 mt-0.5">{kycData.reviewerNote}</p>
                </div>
              </div>
            )}

            {/* Approved Banner */}
            {kycData.kycStatus === 'APPROVED' && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Verification Complete</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">Your account is fully activated. You have access to the dashboard, live orders, and API keys.</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Enter Dashboard
                </Button>
              </div>
            )}

            {/* Document Upload Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <DocumentUploadDropzone
                type="PAN"
                title="1. PAN / Tax Card"
                description="Permanent Account Number of company or director."
                uploadedDoc={uploadedMap.get('PAN')}
                isReadOnly={isReadOnly}
                onUpload={handleUpload}
              />
              <DocumentUploadDropzone
                type="BUSINESS_REGISTRATION"
                title="2. Business Registration"
                description="Certificate of Incorporation, GST, or MSME."
                uploadedDoc={uploadedMap.get('BUSINESS_REGISTRATION')}
                isReadOnly={isReadOnly}
                onUpload={handleUpload}
              />
              <DocumentUploadDropzone
                type="ADDRESS_PROOF"
                title="3. Address Proof"
                description="Utility bill, lease deed, or tax receipt."
                uploadedDoc={uploadedMap.get('ADDRESS_PROOF')}
                isReadOnly={isReadOnly}
                onUpload={handleUpload}
              />
              <DocumentUploadDropzone
                type="BANK_ACCOUNT_PROOF"
                title="4. Bank Account Proof"
                description="Cancelled cheque or statement with IFSC."
                uploadedDoc={uploadedMap.get('BANK_ACCOUNT_PROOF')}
                isReadOnly={isReadOnly}
                onUpload={handleUpload}
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Review turnaround: 15–30 mins</span>
            </div>

            <div>
              {kycData.kycStatus === 'UNDER_REVIEW' ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  Submitted — Awaiting Compliance Decision
                </div>
              ) : kycData.kycStatus === 'APPROVED' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={currentCount < totalRequired}
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit for Compliance Review ({currentCount}/4)
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[11px] text-slate-400 font-mono">
        &copy; {new Date().getFullYear()} Mantu Payment Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
};
export default KycOnboardingPage;
