import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { apiKeysApi } from '../../api/apiKeys';
import { ApiKeyResponse, ApiKeyCreateResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';

export const ApiKeysPage: React.FC = () => {
  const { merchantStatus, onboardingComplete } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<'TEST' | 'LIVE'>('TEST');
  const [createdKeyData, setCreatedKeyData] = useState<ApiKeyCreateResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [keyToRotate, setKeyToRotate] = useState<string | null>(null);

  const isKycApproved = onboardingComplete && merchantStatus === 'ACTIVE';

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      const data = await apiKeysApi.list();
      setKeys(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isKycApproved) {
      loadKeys();
    }
  }, [isKycApproved]);

  const handleCreate = async () => {
    try {
      const res = await apiKeysApi.create({ environment: selectedEnv });
      setCreatedKeyData(res);
      setIsGenerateOpen(false);
      loadKeys();
      showToast('API Key generated successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.errorDescription || 'Key creation failed', 'error');
    }
  };

  const handleRotate = async (keyId: string) => {
    try {
      const res = await apiKeysApi.rotate(keyId);
      setKeyToRotate(null);
      setCreatedKeyData(res);
      loadKeys();
      showToast('Key rotated with 24-hour overlap grace period', 'success');
    } catch (err: any) {
      showToast('Rotation failed', 'error');
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await apiKeysApi.revoke(keyId);
      setKeyToRevoke(null);
      loadKeys();
      showToast('API Key revoked', 'info');
    } catch (err: any) {
      showToast('Revocation failed', 'error');
    }
  };

  if (!isKycApproved) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">API Key Management</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Server-to-server credentials for direct API access and checkout integrations.
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-950">
                KYC Verification Required
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                In compliance with financial regulations, generating live or test API keys requires an active, verified merchant profile.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/onboarding/kyc')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Complete KYC Verification
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">API Key Management</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Manage Test and Production API keys. Secrets use BCrypt storage and are only shown once upon creation.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsGenerateOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Generate New Key
        </Button>
      </div>

      {/* Keys Table Card */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mantu-border bg-slate-50/75 text-mantu-muted font-medium">
                <th className="py-3 px-4 font-semibold">Key ID</th>
                <th className="py-3 px-4 font-semibold">Environment</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold">Rotated At</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mantu-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mantu-muted">
                    Loading API keys...
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mantu-muted">
                    No API keys generated yet. Click "Generate New Key" to create one.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-mantu-text">
                      {k.keyId}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                          k.environment === 'TEST'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {k.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={k.enabled ? 'success' : 'neutral'} dot>
                        {k.enabled ? 'ACTIVE' : 'REVOKED'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-mantu-muted text-[11px]">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-mantu-muted text-[11px]">
                      {k.rotatedAt ? new Date(k.rotatedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setKeyToRotate(k.keyId)}
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                        >
                          Rotate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeyToRevoke(k.keyId)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate Key Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate New API Key"
        description="Select the environment for this credential"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mantu-text mb-2">
              Environment
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedEnv('TEST')}
                className={`p-3 rounded border text-left transition-colors ${
                  selectedEnv === 'TEST'
                    ? 'border-mantu-accent bg-blue-50/40 ring-1 ring-mantu-accent'
                    : 'border-mantu-border bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs text-mantu-text">TEST Mode</div>
                <div className="text-[11px] text-mantu-muted mt-0.5">
                  Safe testing environment with simulated gateway banking responses.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEnv('LIVE')}
                className={`p-3 rounded border text-left transition-colors ${
                  selectedEnv === 'LIVE'
                    ? 'border-mantu-accent bg-blue-50/40 ring-1 ring-mantu-accent'
                    : 'border-mantu-border bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-semibold text-xs text-mantu-text">LIVE Mode</div>
                <div className="text-[11px] text-mantu-muted mt-0.5">
                  Production environment. Connects to real banking routes.
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Generate Credentials
            </Button>
          </div>
        </div>
      </Modal>

      {/* ONE-TIME SECRET REVEAL MODAL */}
      {createdKeyData && (
        <Modal
          isOpen={!!createdKeyData}
          onClose={() => setCreatedKeyData(null)}
          title="Save Your API Key & Secret"
          description="Copy these credentials immediately. For security, the secret cannot be retrieved again."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> The secret key is stored as a one-way BCrypt hash. If lost, you will need to rotate the key.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Key ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.keyId}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-mantu-border rounded select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeyData.keyId);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mantu-text mb-1">
                Key Secret (Only Shown Once)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.rawSecret}
                  className="w-full px-3 py-2 text-xs font-mono bg-rose-50 border border-rose-200 text-rose-900 rounded select-all font-semibold"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeyData.rawSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setCreatedKeyData(null)}>
                I Have Safely Saved My Secret
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rotate Confirmation Modal */}
      {keyToRotate && (
        <Modal
          isOpen={!!keyToRotate}
          onClose={() => setKeyToRotate(null)}
          title="Rotate API Key Secret?"
          description="Generates a replacement secret for this key"
        >
          <div className="space-y-3">
            <p className="text-xs text-mantu-muted leading-relaxed">
              Mantu provides a <strong className="text-mantu-text">24-hour overlap grace period</strong>. Your existing secret will continue to work for 24 hours so you can update your backend servers without downtime.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setKeyToRotate(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleRotate(keyToRotate)}>
                Confirm & Rotate
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Revoke Confirmation Modal */}
      {keyToRevoke && (
        <Modal
          isOpen={!!keyToRevoke}
          onClose={() => setKeyToRevoke(null)}
          title="Revoke API Key?"
          description="This action is permanent"
        >
          <div className="space-y-3">
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded border border-rose-200">
              Any merchant application or script attempting to call Mantu Gateway with this Key ID will immediately receive HTTP 401 Unauthorized.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setKeyToRevoke(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleRevoke(keyToRevoke)}>
                Revoke Key
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
