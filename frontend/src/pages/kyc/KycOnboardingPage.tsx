import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kycApi } from '../../api/kyc';
import { KycOnboardingResponse, KycDocumentType } from '../../types/api';
import { DocumentUploadDropzone } from '../../components/kyc/DocumentUploadDropzone';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';

export const KycOnboardingPage: React.FC = () => {
  const { refreshKycStatus } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [kycData, setKycData] = useState<KycOnboardingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchKyc = async () => {
    try {
      setIsLoading(true);
      const res = await kycApi.getStatus();
      setKycData(res);
    } catch (err: any) {
      console.error(err);
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

  if (isLoading || !kycData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mantu-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-mantu-muted font-mono">Loading compliance profile...</p>
        </div>
      </div>
    );
  }

  const uploadedMap = new Map(
    kycData.uploadedDocuments.map((d) => [d.documentType, d])
  );

  const totalRequired = 4;
  const currentCount = kycData.uploadedDocuments.length;
  const progressPercent = Math.min(100, Math.round((currentCount / totalRequired) * 100));
  const isReadOnly = kycData.kycStatus === 'UNDER_REVIEW' || kycData.kycStatus === 'APPROVED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-mantu-border">
        <div>
          <h2 className="text-lg font-bold text-mantu-text">Merchant KYC Onboarding</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Gateway regulations require mandatory verification of 4 business documents before API key generation & payments are unlocked.
          </p>
        </div>
        <div>
          <span className="text-xs font-mono text-mantu-muted mr-2">Status:</span>
          {kycData.kycStatus === 'APPROVED' && (
            <Badge variant="success" dot className="text-xs py-1 px-2.5">
              APPROVED (ACTIVE)
            </Badge>
          )}
          {kycData.kycStatus === 'UNDER_REVIEW' && (
            <Badge variant="accent" dot className="text-xs py-1 px-2.5">
              UNDER OPS REVIEW
            </Badge>
          )}
          {kycData.kycStatus === 'DRAFT' && (
            <Badge variant="warning" dot className="text-xs py-1 px-2.5">
              DRAFT (DOCUMENTS PENDING)
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

      {/* Reviewer Notice (if rejected or waitlisted) */}
      {kycData.reviewerNote && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-rose-900">Compliance Officer Note:</h4>
            <p className="text-xs text-rose-800 mt-1">{kycData.reviewerNote}</p>
            <p className="text-[11px] text-rose-700 mt-1 font-mono">
              Please replace the flagged document below and re-submit.
            </p>
          </div>
        </div>
      )}

      {/* Approved Success Callout */}
      {kycData.kycStatus === 'APPROVED' && (
        <Card className="bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-950">
                  Verification Complete & Account Activated
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your merchant entity has been verified. You now have full access to API keys, Webhooks, and Live Checkout.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Dashboard
            </Button>
          </div>
        </Card>
      )}

      {/* Progress Card */}
      <Card
        title="Document Checklist"
        subtitle={`Mandatory documents completed: ${currentCount} of ${totalRequired}`}
        action={
          <span className="font-mono text-xs font-semibold text-mantu-accent">
            {progressPercent}% Complete
          </span>
        }
      >
        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-mantu-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 4 Document Dropzones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentUploadDropzone
            type="PAN"
            title="1. PAN / Tax Card"
            description="Permanent Account Number card of business or authorized director."
            uploadedDoc={uploadedMap.get('PAN')}
            isReadOnly={isReadOnly}
            onUpload={handleUpload}
          />
          <DocumentUploadDropzone
            type="BUSINESS_REGISTRATION"
            title="2. Business Registration Proof"
            description="Certificate of Incorporation, GST certificate, or MSME registration."
            uploadedDoc={uploadedMap.get('BUSINESS_REGISTRATION')}
            isReadOnly={isReadOnly}
            onUpload={handleUpload}
          />
          <DocumentUploadDropzone
            type="ADDRESS_PROOF"
            title="3. Address Proof"
            description="Recent utility bill, lease agreement, or property tax receipt."
            uploadedDoc={uploadedMap.get('ADDRESS_PROOF')}
            isReadOnly={isReadOnly}
            onUpload={handleUpload}
          />
          <DocumentUploadDropzone
            type="BANK_ACCOUNT_PROOF"
            title="4. Bank Account Verification"
            description="Cancelled cheque or latest bank statement showing Account & IFSC."
            uploadedDoc={uploadedMap.get('BANK_ACCOUNT_PROOF')}
            isReadOnly={isReadOnly}
            onUpload={handleUpload}
          />
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-mantu-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-mantu-muted flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Typical manual ops review turnaround: 15–30 minutes</span>
          </div>

          <div>
            {kycData.kycStatus === 'UNDER_REVIEW' ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-2 rounded border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Submitted on {new Date(kycData.submittedAt || Date.now()).toLocaleTimeString()} — Awaiting Decision
              </div>
            ) : kycData.kycStatus === 'APPROVED' ? (
              <div className="text-xs font-semibold text-emerald-700">
                ✓ Fully Approved
              </div>
            ) : (
              <Button
                variant="primary"
                disabled={currentCount < totalRequired}
                isLoading={isSubmitting}
                onClick={handleSubmit}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit KYC for Review ({currentCount}/4)
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
