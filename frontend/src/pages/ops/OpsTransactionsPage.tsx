import React, { useEffect, useState } from 'react';
import {
  Eye,
  LogOut,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { internalApi } from '../../api/internal';
import { OpsTransaction } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export const OpsTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<OpsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<OpsTransaction | null>(null);

  const { email, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setTransactions(await internalApi.getOpsTransactions(200));
    } catch (err) {
      console.error(err);
      showToast('Failed to load cross-merchant transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const formatRupees = (units: number, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(units / 100);

  const riskBadgeVariant = (level?: string | null) => {
    if (!level) return 'neutral';
    const upper = level.toUpperCase();
    if (upper === 'HIGH' || upper === 'CRITICAL') return 'error';
    if (upper === 'MEDIUM') return 'warning';
    return 'success';
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'CAPTURED' || status === 'SETTLED') return 'success';
    if (status === 'FAILED' || status === 'CANCELLED' || status === 'AUTH_EXPIRED') return 'error';
    return 'warning';
  };

  const filtered = transactions.filter((tx) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tx.id.toLowerCase().includes(q) ||
      tx.orderId.toLowerCase().includes(q) ||
      tx.merchantId.toLowerCase().includes(q) ||
      (tx.selectedRouteId && tx.selectedRouteId.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const txRisk = (tx.fraudRiskLevel || 'UNSCORED').toUpperCase();
    const matchesRisk = riskFilter === 'ALL' || txRisk === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-mantu-bg">
      <header className="border-b border-mantu-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-900 font-bold text-white">M</div>
              <div>
                <h1 className="text-sm font-bold text-mantu-text">Mantu Operations Console</h1>
                <p className="text-[11px] text-mantu-muted">Risk, compliance &amp; ML monitoring</p>
              </div>
            </div>
            <nav className="flex items-center gap-1 rounded border border-mantu-border bg-slate-50 p-1 text-xs">
              <Link to="/ops/risk" className="rounded px-3 py-1 font-medium text-mantu-muted hover:text-mantu-text">
                Risk Command Center
              </Link>
              <Link to="/ops/transactions" className="rounded bg-white px-3 py-1 font-semibold text-mantu-text shadow-xs">
                All Transactions
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-mantu-muted sm:inline">{email}</span>
            <Badge variant="success" dot>OPS ADMIN</Badge>
            <Button variant="outline" size="sm" onClick={signOut} leftIcon={<LogOut className="h-3.5 w-3.5" />}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-mantu-text">All Merchant Transactions</h2>
            <p className="mt-0.5 text-xs text-mantu-muted">
              Cross-merchant payment ledger with ML fraud screening scores and smart-routing decisions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-mantu-border bg-white p-3.5 shadow-xs">
          <div className="flex flex-1 min-w-[260px] flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-mantu-muted" />
              <input
                type="text"
                placeholder="Search Payment ID, Order ID, Merchant ID, or Route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-mantu-border py-1.5 pl-9 pr-3 text-xs focus:border-mantu-accent focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-mantu-border bg-white px-3 py-1.5 text-xs text-mantu-text focus:border-mantu-accent focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CAPTURED">CAPTURED</option>
              <option value="SETTLED">SETTLED</option>
              <option value="AUTHORIZING">AUTHORIZING</option>
              <option value="FAILED">FAILED</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded border border-mantu-border bg-white px-3 py-1.5 text-xs text-mantu-text focus:border-mantu-accent focus:outline-none"
            >
              <option value="ALL">All Fraud Risks</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="UNSCORED">UNSCORED</option>
            </select>
          </div>

          <div className="font-mono text-xs text-mantu-muted">
            Showing {filtered.length} of {transactions.length} transactions
          </div>
        </div>

        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-mantu-border bg-slate-50/75 font-medium text-mantu-muted">
                  <th className="px-4 py-3 font-semibold">Payment / Merchant</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold">Fraud Screening</th>
                  <th className="px-4 py-3 font-semibold">Smart Routing</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mantu-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-mantu-muted">
                      Loading cross-merchant transactions...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-mantu-muted">
                      No transactions match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-mantu-text">{tx.id.slice(0, 12)}…</div>
                        <div className="font-mono text-[11px] text-mantu-muted">
                          Merchant: {tx.merchantId.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-mantu-text">{tx.method}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-mantu-text">
                        {formatRupees(tx.amountUnits, tx.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusBadgeVariant(tx.status) as any} dot>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tx.fraudRiskLevel ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={riskBadgeVariant(tx.fraudRiskLevel) as any}>
                                {tx.fraudRiskLevel}
                              </Badge>
                              {typeof tx.fraudProbability === 'number' && (
                                <span className="font-mono text-[11px] text-mantu-text">
                                  {(tx.fraudProbability * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-mantu-muted">
                              {tx.fraudModelVersion || 'ml-fraud'}
                              {tx.fraudPlaceholder ? ' (placeholder)' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-mantu-muted">Fallback / Unscored</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[11px] font-medium text-mantu-text">
                            {tx.selectedRouteId || '—'}
                          </span>
                          <span className="font-mono text-[10px] text-mantu-muted">
                            {tx.routingModelVersion || (tx.selectedRouteId ? 'deterministic' : '—')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-mantu-muted">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Operations Transaction Audit"
        maxWidth="2xl"
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 rounded border border-mantu-border bg-slate-50 p-3 sm:grid-cols-2">
              <div className="min-w-0">
                <span className="text-mantu-muted">Payment ID</span>
                <p className="font-mono font-semibold text-mantu-text break-all">{selectedTx.id}</p>
              </div>
              <div className="min-w-0">
                <span className="text-mantu-muted">Merchant ID</span>
                <p className="font-mono font-semibold text-mantu-text break-all">{selectedTx.merchantId}</p>
              </div>
              <div className="min-w-0">
                <span className="text-mantu-muted">Order ID</span>
                <p className="font-mono text-mantu-text break-all">{selectedTx.orderId}</p>
              </div>
              <div className="min-w-0">
                <span className="text-mantu-muted">Amount &amp; Status</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-mantu-text">
                    {formatRupees(selectedTx.amountUnits, selectedTx.currency)}
                  </span>
                  <Badge variant={statusBadgeVariant(selectedTx.status) as any} dot>
                    {selectedTx.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded border border-mantu-border p-3.5">
                <div className="mb-2 flex items-center gap-2 font-semibold text-mantu-text">
                  {selectedTx.fraudRiskLevel === 'HIGH' ? (
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  ML Fraud Screening
                </div>
                <dl className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Risk Level</dt>
                    <dd className="min-w-0 text-right">
                      <Badge variant={riskBadgeVariant(selectedTx.fraudRiskLevel) as any}>
                        {selectedTx.fraudRiskLevel || 'UNSCORED'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Fraud Probability</dt>
                    <dd className="min-w-0 text-right font-mono font-semibold text-mantu-text break-all">
                      {typeof selectedTx.fraudProbability === 'number'
                        ? `${(selectedTx.fraudProbability * 100).toFixed(2)}%`
                        : 'Unavailable (fallback)'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Model Version</dt>
                    <dd className="min-w-0 text-right font-mono text-mantu-text break-all">
                      {selectedTx.fraudModelVersion || '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Mode</dt>
                    <dd className="min-w-0 text-right text-mantu-text">
                      {selectedTx.fraudPlaceholder == null
                        ? 'Fallback'
                        : selectedTx.fraudPlaceholder
                          ? 'Placeholder'
                          : 'Live ML'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="min-w-0 rounded border border-mantu-border p-3.5">
                <div className="mb-2 flex items-center gap-2 font-semibold text-mantu-text">
                  <Route className="h-4 w-4 shrink-0 text-mantu-accent" />
                  Smart Routing Decision
                </div>
                <dl className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Selected Route</dt>
                    <dd className="min-w-0 text-right font-mono font-semibold text-mantu-text break-all">
                      {selectedTx.selectedRouteId || '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Model Version</dt>
                    <dd className="min-w-0 text-right font-mono text-mantu-text break-all">
                      {selectedTx.routingModelVersion || '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Mode</dt>
                    <dd className="min-w-0 text-right text-mantu-text">
                      {selectedTx.routingPlaceholder == null
                        ? '—'
                        : selectedTx.routingPlaceholder
                          ? 'Deterministic Fallback'
                          : 'Live ML'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-mantu-muted">Bank Reference</dt>
                    <dd className="min-w-0 text-right font-mono text-mantu-text break-all">
                      {selectedTx.bankReference || '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {selectedTx.errorCode && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-800 break-words">
                <div className="font-semibold break-all">Error: {selectedTx.errorCode}</div>
                {selectedTx.errorDescription && (
                  <div className="mt-0.5 break-words">{selectedTx.errorDescription}</div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
