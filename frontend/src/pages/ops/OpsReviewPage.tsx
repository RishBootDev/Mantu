import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { internalApi } from '../../api/internal';
import { kycApi } from '../../api/kyc';
import { KycOnboardingResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';

export const OpsReviewPage: React.FC = () => {
  const { refreshKycStatus, businessName, email } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [kycData, setKycData] = useState<KycOnboardingResponse | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKyc = async () => {
    try {
      const res = await kycApi.getStatus();
      setKycData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED' | 'WAITLISTED') => {
    if ((decision === 'REJECTED' || decision === 'WAITLISTED') && !decisionNote.trim()) {
      showToast('A reviewer note is required when rejecting or waitlisting.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await internalApi.submitKycDecision('mock_ops_token_123', {
        decision,
        note: decisionNote,
      });

      await refreshKycStatus();
      await loadKyc();
      showToast(`Decision registered: ${decision}`, 'success');
      if (decision === 'APPROVED') {
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err: any) {
      showToast('Failed to record compliance decision', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono font-bold uppercase mb-1">
          Internal Compliance Portal
        </div>
        <h2 className="text-xl font-bold text-mantu-text">Merchant KYC Review & Audit</h2>
        <p className="text-xs text-mantu-muted mt-0.5">
          Auditing case for <span className="font-semibold text-mantu-text">{businessName}</span> ({email}).
        </p>
      </div>

      {/* Case Overview */}
      <Card title="Merchant Submission Details" subtitle="Case ID: kyc_case_e4b2d56a">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
          <div>
            <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Legal Entity</span>
            <span className="font-medium text-mantu-text">{businessName}</span>
          </div>
          <div>
            <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Current KYC Status</span>
            <span className="font-mono font-bold text-mantu-accent">{kycData?.kycStatus || 'DRAFT'}</span>
          </div>
          <div>
            <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Account State</span>
            <span className="font-mono text-mantu-text">{kycData?.merchantStatus || 'PENDING_KYC'}</span>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div>
          <h4 className="text-xs font-semibold text-mantu-text mb-2">Uploaded Document Dossier:</h4>
          <div className="space-y-2">
            {kycData?.uploadedDocuments.length === 0 ? (
              <p className="text-xs text-mantu-muted italic">Merchant has not uploaded documents yet.</p>
            ) : (
              kycData?.uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-mantu-border text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-mantu-accent" />
                    <div>
                      <span className="font-bold text-mantu-text">{doc.documentType}</span>
                      <span className="text-mantu-muted text-[11px] block font-mono">
                        {doc.originalFilename} ({(doc.sizeBytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified Hash
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Decision Console */}
      <Card title="Compliance Officer Decision" subtitle="Will update merchant status in gateway registry">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-mantu-text mb-1">
              Reviewer Notes / Rejection Reason (Mandatory if Rejecting or Waitlisting)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Certificate of incorporation address must match utility bill exactly."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
            />
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={() => handleDecision('APPROVED')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve KYC & Activate Merchant
            </Button>

            <Button
              variant="secondary"
              size="md"
              isLoading={isSubmitting}
              onClick={() => handleDecision('WAITLISTED')}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Waitlist (Ask for More Info)
            </Button>

            <Button
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              onClick={() => handleDecision('REJECTED')}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject KYC
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
