import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { paymentsApi } from '../../api/payments';
import { PaymentResponse } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { businessName } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    setPayments(paymentsApi.getLocalDemoHistory());
  }, []);

  // Format currency in Indian Rupees
  const formatRupees = (units: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(units / 100);
  };

  const capturedPayments = payments.filter((p) => p.status === 'CAPTURED');
  const failedPayments = payments.filter((p) => p.status === 'FAILED');
  const totalVolumeUnits = capturedPayments.reduce((acc, p) => acc + p.amount.amountUnits, 0);
  const totalAttempts = payments.length || 1;
  const successRate = ((capturedPayments.length / totalAttempts) * 100).toFixed(1);

  // Method breakdown counts
  const cardCount = payments.filter((p) => p.method === 'CARD').length;
  const upiCount = payments.filter((p) => p.method === 'UPI').length;
  const netBankingCount = payments.filter((p) => p.method === 'NETBANKING').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">Merchant Dashboard</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Real-time analytics, settlement health & transaction throughput for <span className="font-semibold text-mantu-text">{businessName}</span>.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 p-1 bg-white border border-mantu-border rounded shadow-xs">
          <button
            onClick={() => setTimeframe('24h')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              timeframe === '24h'
                ? 'bg-mantu-accent text-white'
                : 'text-mantu-muted hover:text-mantu-text'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              timeframe === '7d'
                ? 'bg-mantu-accent text-white'
                : 'text-mantu-muted hover:text-mantu-text'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              timeframe === '30d'
                ? 'bg-mantu-accent text-white'
                : 'text-mantu-muted hover:text-mantu-text'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Demo analytics: the supplied API contract does not include a payment-history or analytics endpoint. This view shows local checkout-simulator activity only.
      </div>

      {/* 5 Compact Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Processed</span>
            <TrendingUp className="w-4 h-4 text-mantu-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-mantu-text tracking-tight">
            {formatRupees(totalVolumeUnits)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span className="font-mono">+12.4%</span> vs prior period
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Success Rate</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-mantu-text tracking-tight">
            {successRate}%
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mantu-muted font-medium">
            <span className="font-mono">{capturedPayments.length}</span> captured / <span className="font-mono">{payments.length}</span> total
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 tracking-tight">
            {capturedPayments.length}
          </div>
          <div className="mt-2 text-[11px] text-mantu-muted font-medium">
            Directly routed & settled
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Failed / Blocked</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 tracking-tight">
            {failedPayments.length}
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-medium">
            Includes ML Risk triggers
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Refunds Processed</span>
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-mantu-text tracking-tight">
            ₹0.00
          </div>
          <div className="mt-2 text-[11px] text-mantu-muted font-medium">
            0 chargeback disputes
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-mantu-border">
            <div>
              <h3 className="text-sm font-semibold text-mantu-text">Transaction Volume Trend</h3>
              <p className="text-xs text-mantu-muted mt-0.5">Daily gross captured volume in INR</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-mantu-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-mantu-accent" />
                Captured Volume
              </span>
            </div>
          </div>

          {/* SVG Vector Line Chart */}
          <div className="h-64 w-full pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2457D6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2457D6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="#E5E9EF" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="580" y2="80" stroke="#E5E9EF" strokeDasharray="3 3" />
              <line x1="40" y1="130" x2="580" y2="130" stroke="#E5E9EF" strokeDasharray="3 3" />
              <line x1="40" y1="180" x2="580" y2="180" stroke="#E5E9EF" />

              {/* Y Axis Labels */}
              <text x="35" y="34" textAnchor="end" className="text-[10px] fill-slate-400 font-mono">₹10L</text>
              <text x="35" y="84" textAnchor="end" className="text-[10px] fill-slate-400 font-mono">₹5L</text>
              <text x="35" y="134" textAnchor="end" className="text-[10px] fill-slate-400 font-mono">₹2.5L</text>
              <text x="35" y="184" textAnchor="end" className="text-[10px] fill-slate-400 font-mono">₹0</text>

              {/* Area fill */}
              <polygon
                points="60,180 60,140 140,110 220,130 300,70 380,85 460,40 540,65 540,180"
                fill="url(#chartGradient)"
              />

              {/* Polyline */}
              <polyline
                points="60,140 140,110 220,130 300,70 380,85 460,40 540,65"
                fill="none"
                stroke="#2457D6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {[
                { x: 60, y: 140, val: '₹1.2L' },
                { x: 140, y: 110, val: '₹3.4L' },
                { x: 220, y: 130, val: '₹2.8L' },
                { x: 300, y: 70, val: '₹6.1L' },
                { x: 380, y: 85, val: '₹4.9L' },
                { x: 460, y: 40, val: '₹8.9L' },
                { x: 540, y: 65, val: '₹7.5L' },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  className="fill-white stroke-mantu-accent stroke-2 cursor-pointer hover:r-6 transition-all"
                />
              ))}

              {/* X Axis Dates */}
              <text x="60" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 10</text>
              <text x="140" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 11</text>
              <text x="220" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 12</text>
              <text x="300" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 13</text>
              <text x="380" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 14</text>
              <text x="460" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 15</text>
              <text x="540" y="196" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Nov 16</text>
            </svg>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-5 rounded border border-mantu-border shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-mantu-text">Method Distribution</h3>
            <p className="text-xs text-mantu-muted mt-0.5">Transactions processed by channel</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-mantu-text">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Cards (Visa / Master / RuPay)
                  </span>
                  <span className="font-mono text-mantu-muted">
                    {Math.round((cardCount / totalAttempts) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(cardCount / totalAttempts) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-mantu-text">
                    <span className="font-bold text-[10px] text-emerald-600">UPI</span>
                    Unified Payments Interface
                  </span>
                  <span className="font-mono text-mantu-muted">
                    {Math.round((upiCount / totalAttempts) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${(upiCount / totalAttempts) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-mantu-text">
                    <span className="font-bold text-[10px] text-indigo-600">NB</span>
                    NetBanking (Direct Bank API)
                  </span>
                  <span className="font-mono text-mantu-muted">
                    {Math.round((netBankingCount / totalAttempts) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(netBankingCount / totalAttempts) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-mantu-border bg-slate-50 -mx-5 -mb-5 p-4 rounded-b">
            <div className="flex items-center justify-between text-xs text-mantu-muted">
              <span>ML Smart Routing Status:</span>
              <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active (Auto-Optimized)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <Card
        title="Recent Transactions"
        subtitle="Latest 5 payment attempts screened by Mantu Gateway"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/transactions')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All Transactions
          </Button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mantu-border bg-slate-50/75 text-mantu-muted font-medium">
                <th className="py-2.5 px-4 font-semibold">Payment ID</th>
                <th className="py-2.5 px-4 font-semibold">Order ID</th>
                <th className="py-2.5 px-4 font-semibold">Method</th>
                <th className="py-2.5 px-4 font-semibold">Smart Route</th>
                <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold">Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mantu-border font-sans">
              {payments.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-mantu-text">
                    {p.id}
                  </td>
                  <td className="py-3 px-4 font-mono text-mantu-muted">
                    {p.orderId}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-mantu-text">
                      {p.method}
                      {p.methodDetails?.brand && (
                        <span className="font-mono text-[10px] text-mantu-muted">
                          ({p.methodDetails.brand})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-mantu-muted">
                    {p.selectedRouteId || 'fastapi_ml_route'}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-mantu-text text-right">
                    {formatRupees(p.amount.amountUnits)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.status === 'CAPTURED' && (
                      <Badge variant="success" dot>
                        CAPTURED
                      </Badge>
                    )}
                    {p.status === 'FAILED' && (
                      <Badge variant="error" dot title={p.errorDescription || undefined}>
                        FAILED
                      </Badge>
                    )}
                    {p.status === 'AUTHORIZING' && (
                      <Badge variant="warning" dot>
                        AUTHORIZING
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-mantu-muted">
                    {new Date(p.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
