import React, { useState, useEffect, useMemo } from 'react';
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

// ── Inline SVG Bar Chart ───────────────────────────────────────────────────
interface VolumeBarChartProps {
  data: { date: string; units: number }[];
  formatRupees: (units: number) => string;
}

const VolumeBarChart: React.FC<VolumeBarChartProps> = ({ data, formatRupees }) => {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const maxUnits = Math.max(...data.map((d) => d.units), 1);
  const hasData = data.some((d) => d.units > 0);

  if (!hasData) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded">
        <div className="text-center p-6">
          <p className="text-xs font-semibold text-mantu-text">No transaction volume recorded</p>
          <p className="text-[11px] text-mantu-muted mt-1">
            Volume trends will appear here as transactions are processed.
          </p>
        </div>
      </div>
    );
  }

  const W = 600;
  const H = 220;
  const paddingLeft = 72;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 44;
  const chartW = W - paddingLeft - paddingRight;
  const chartH = H - paddingTop - paddingBottom;
  const barCount = data.length;
  const barGap = Math.max(2, Math.floor(chartW / barCount * 0.18));
  const barWidth = (chartW - barGap * (barCount - 1)) / barCount;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    frac: f,
    label: formatRupees(Math.round(maxUnits * f)),
    y: paddingTop + chartH - f * chartH,
  }));

  return (
    <div className="h-64 w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        className="overflow-visible"
        style={{ fontFamily: 'inherit' }}
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line
            key={i}
            x1={paddingLeft}
            x2={W - paddingRight}
            y1={t.y}
            y2={t.y}
            stroke="#e2e8f0"
            strokeWidth={i === 0 ? 1.5 : 0.75}
            strokeDasharray={i === 0 ? undefined : '4 3'}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text
            key={i}
            x={paddingLeft - 6}
            y={t.y + 4}
            textAnchor="end"
            fontSize={9}
            fill="#94a3b8"
            fontFamily="ui-monospace, monospace"
          >
            {t.label}
          </text>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = d.units === 0 ? 0 : Math.max(3, (d.units / maxUnits) * chartH);
          const x = paddingLeft + i * (barWidth + barGap);
          const y = paddingTop + chartH - barH;
          const isHovered = hovered === i;
          const shortDate = d.date.slice(5); // MM-DD
          const label = `${shortDate.replace('-', '/')}`;

          return (
            <g key={d.date}>
              {/* Hover highlight column */}
              <rect
                x={x - barGap / 2}
                y={paddingTop}
                width={barWidth + barGap}
                height={chartH}
                fill={isHovered ? '#eff6ff' : 'transparent'}
                rx={2}
              />
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={Math.min(3, barWidth / 4)}
                fill={isHovered ? '#1e40af' : '#1d4ed8'}
                opacity={isHovered ? 1 : 0.85}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'default', transition: 'fill 0.1s, opacity 0.1s' }}
              />
              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(x - 2, W - paddingRight - 90)}
                    y={y - 36}
                    width={Math.min(barWidth + 4, 92)}
                    height={28}
                    rx={4}
                    fill="#1e293b"
                    opacity={0.92}
                  />
                  <text
                    x={Math.min(x + barWidth / 2, W - paddingRight - 46)}
                    y={y - 25}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill="#94a3b8"
                    fontFamily="ui-monospace, monospace"
                  >
                    {d.date}
                  </text>
                  <text
                    x={Math.min(x + barWidth / 2, W - paddingRight - 46)}
                    y={y - 14}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="white"
                    fontFamily="ui-monospace, monospace"
                    fontWeight="600"
                  >
                    {formatRupees(d.units)}
                  </text>
                </g>
              )}
              {/* X-axis label — only show some to prevent crowding */}
              {(barCount <= 10 || i % Math.ceil(barCount / 10) === 0 || i === barCount - 1) && (
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartH + 14}
                  textAnchor="middle"
                  fontSize={barCount > 15 ? 7.5 : 9}
                  fill="#94a3b8"
                  fontFamily="ui-monospace, monospace"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const OverviewPage: React.FC = () => {
  const { businessName } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    paymentsApi
      .list()
      .then(setPayments)
      .catch((err) => console.error('Failed to load dashboard payments:', err));
  }, []);

                                     
  const formatRupees = (units: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(units / 100);
  };

  const capturedPayments = payments.filter((p) => p.status === 'CAPTURED' || p.status === 'SETTLED');
  const failedPayments = payments.filter((p) => p.status === 'FAILED');
  const totalVolumeUnits = capturedPayments.reduce((acc, p) => acc + p.amount.amountUnits, 0);
  const totalAttempts = payments.length || 1;
  const successRate = ((capturedPayments.length / totalAttempts) * 100).toFixed(1);

  // ── Transaction Volume Trend ─────────────────────────────────────────────
  const volumeByDay = useMemo(() => {
    const now = new Date();
    const numDays = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const cutoff = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);

    // Pre-fill every day in the range with 0
    const days: Record<string, number> = {};
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }

    capturedPayments
      .filter((p) => new Date(p.createdAt) >= cutoff)
      .forEach((p) => {
        const day = new Date(p.createdAt).toISOString().slice(0, 10);
        if (day in days) days[day] = (days[day] || 0) + p.amount.amountUnits;
      });

    return Object.entries(days).map(([date, units]) => ({ date, units }));
  }, [capturedPayments, timeframe]);

                            
  const cardCount = payments.filter((p) => p.method === 'CARD').length;
  const upiCount = payments.filter((p) => p.method === 'UPI').length;
  const netBankingCount = payments.filter((p) => p.method === 'NETBANKING').length;

  return (
    <div className="space-y-6">
      {                                 }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">Merchant Dashboard</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Real-time analytics, settlement health & transaction throughput for <span className="font-semibold text-mantu-text">{businessName}</span>.
          </p>
        </div>

        {                 }
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

      {                                }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded border border-mantu-border shadow-card">
          <div className="flex items-center justify-between text-mantu-muted mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Processed</span>
            <TrendingUp className="w-4 h-4 text-mantu-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-mantu-text tracking-tight">
            {formatRupees(totalVolumeUnits)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mantu-muted font-medium">
            {payments.length > 0 ? (
              <span className="font-mono">{payments.length} transactions recorded</span>
            ) : (
              <span>No transactions recorded</span>
            )}
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
            Declined or blocked payments
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

      {                }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {                                             }
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

          {/* SVG Bar Chart — Transaction Volume Trend */}
          <VolumeBarChart data={volumeByDay} formatRupees={formatRupees} />
        </div>

        {                                 }
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
              <span>Gateway Status:</span>
              <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operational (Live)
              </span>
            </div>
          </div>
        </div>
      </div>

      {                              }
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
                <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold">Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mantu-border font-sans">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mantu-muted text-xs">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 5).map((p) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
