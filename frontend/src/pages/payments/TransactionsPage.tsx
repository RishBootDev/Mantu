import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  XCircle,
  RefreshCw,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { paymentsApi } from '../../api/payments';
import { PaymentResponse } from '../../types/api';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';

export const TransactionsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await paymentsApi.list();
      setPayments(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = (paymentId: string) => {
    const updated = payments.map((p) => {
      if (p.id === paymentId) {
        return { ...p, status: 'REFUNDED' as const };
      }
      return p;
    });
    setPayments(updated);
    localStorage.setItem('mantu_mock_payments', JSON.stringify(updated));
    if (selectedPayment && selectedPayment.id === paymentId) {
      setSelectedPayment({ ...selectedPayment, status: 'REFUNDED' });
    }
    showToast(`Refund processed for ${paymentId}`, 'success');
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupees = (units: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(units / 100);
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.methodDetails?.brand && p.methodDetails.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.methodDetails?.vpa && p.methodDetails.vpa.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">Payments & Transactions</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Audit log of all charges, routing decisions, and ML fraud inspection events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/checkout-demo')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Simulate Checkout
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded border border-mantu-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-mantu-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Payment ID, Order ID, or VPA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-mantu-border rounded px-3 py-1.5 focus:outline-none focus:border-mantu-accent bg-white text-mantu-text"
          >
            <option value="ALL">All Statuses</option>
            <option value="CAPTURED">CAPTURED</option>
            <option value="FAILED">FAILED</option>
            <option value="AUTHORIZING">AUTHORIZING</option>
          </select>

          {/* Method Dropdown */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs border border-mantu-border rounded px-3 py-1.5 focus:outline-none focus:border-mantu-accent bg-white text-mantu-text"
          >
            <option value="ALL">All Methods</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
            <option value="NETBANKING">NetBanking</option>
          </select>
        </div>

        <div className="text-xs text-mantu-muted font-mono">
          Showing {filtered.length} of {payments.length} records
        </div>
      </div>

      {/* Transactions Table Card */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mantu-border bg-slate-50/75 text-mantu-muted font-medium">
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Order Reference</th>
                <th className="py-3 px-4 font-semibold">Method & Details</th>
                <th className="py-3 px-4 font-semibold">Gateway Route</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mantu-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-mantu-muted">
                    Loading transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-mantu-muted">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-mantu-accent">
                      {p.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-mantu-muted text-[11px]">
                      {p.orderId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-mantu-text">{p.method}</div>
                      {p.methodDetails?.brand && (
                        <div className="font-mono text-[10px] text-mantu-muted">
                          {p.methodDetails.brand} •••• {p.methodDetails.lastFour}
                        </div>
                      )}
                      {p.methodDetails?.vpa && (
                        <div className="font-mono text-[10px] text-mantu-muted truncate max-w-[150px]">
                          {p.methodDetails.vpa}
                        </div>
                      )}
                      {p.methodDetails?.bank && (
                        <div className="font-mono text-[10px] text-mantu-muted">
                          Bank: {p.methodDetails.bank}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-mantu-muted">
                      {p.selectedRouteId || 'fastapi_ml_route'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-mantu-text text-right">
                      {formatRupees(p.amount.amountUnits)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.status === 'CAPTURED' && <Badge variant="success" dot>CAPTURED</Badge>}
                      {p.status === 'FAILED' && <Badge variant="error" dot>FAILED</Badge>}
                      {p.status === 'AUTHORIZING' && <Badge variant="warning" dot>AUTHORIZING</Badge>}
                      {p.status === 'REFUNDED' && <Badge variant="neutral" dot>REFUNDED</Badge>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-mantu-muted">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'CAPTURED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefund(p.id)}
                            leftIcon={<RotateCcw className="w-3 h-3 text-amber-600" />}
                          >
                            Refund
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(p)}
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          Inspect
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

      {/* Transaction Detail & Raw JSON Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Inspector: ${selectedPayment.id}`}
          description={`Processed via Mantu Payment Service`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-mantu-border rounded text-xs">
              <div>
                <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Status</span>
                <span className="font-bold text-mantu-text">{selectedPayment.status}</span>
              </div>
              <div>
                <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Amount</span>
                <span className="font-mono font-bold text-mantu-text">
                  {formatRupees(selectedPayment.amount.amountUnits)}
                </span>
              </div>
              <div>
                <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Method</span>
                <span className="font-medium text-mantu-text">{selectedPayment.method}</span>
              </div>
              <div>
                <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Selected Route</span>
                <span className="font-mono text-mantu-muted text-[11px]">{selectedPayment.selectedRouteId}</span>
              </div>
              <div className="col-span-2">
                <span className="text-mantu-muted block text-[10px] uppercase font-semibold">Order ID</span>
                <span className="font-mono text-mantu-text text-[11px]">{selectedPayment.orderId}</span>
              </div>
            </div>

            {selectedPayment.errorCode && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Declined: {selectedPayment.errorCode}
                </div>
                <div className="text-rose-800 mt-1">{selectedPayment.errorDescription}</div>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-mantu-text block mb-1">
                Raw JSON Wire Payload
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto max-h-56">
                {JSON.stringify(selectedPayment, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-between items-center">
              {selectedPayment.status === 'CAPTURED' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefund(selectedPayment.id)}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Issue Full Refund
                </Button>
              ) : <div />}
              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
