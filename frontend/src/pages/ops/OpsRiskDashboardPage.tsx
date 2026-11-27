import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CircleDollarSign, LogOut, RefreshCw, Route, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { internalApi } from '../../api/internal';
import { OperationsRiskDashboard } from '../../types/api';
import { useAuth } from '../../context/AuthContext';

const percentage = (numerator: number, denominator: number) =>
  denominator === 0 ? '0.0%' : `${((numerator / denominator) * 100).toFixed(1)}%`;

export const OpsRiskDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<OperationsRiskDashboard | null>(null);
  const [hours, setHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const loadDashboard = async (windowHours = hours) => {
    try {
      setIsLoading(true);
      setDashboard(await internalApi.getRiskDashboard(windowHours));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDashboard(hours); }, [hours]);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const payments = dashboard?.payments;
  const severity = (value: string) => value === 'CRITICAL' ? 'error' : value === 'HIGH' ? 'warning' : 'neutral';

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
              <Link to="/ops/risk" className="rounded bg-white px-3 py-1 font-semibold text-mantu-text shadow-xs">
                Risk Command Center
              </Link>
              <Link to="/ops/transactions" className="rounded px-3 py-1 font-medium text-mantu-muted hover:text-mantu-text">
                All Transactions
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-mantu-muted sm:inline">{email}</span>
            <Badge variant="success" dot>OPS ADMIN</Badge>
            <Button variant="outline" size="sm" onClick={signOut} leftIcon={<LogOut className="h-3.5 w-3.5" />}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-mantu-text">Risk command center</h2>
            <p className="mt-0.5 text-xs text-mantu-muted">
              Fraud enforcement, smart-routing activity, and real-time anomaly alerts {hours === 0 ? 'across all recorded payments' : `for the last ${hours} hours`}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Monitoring window"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded border border-mantu-border bg-white px-2.5 py-1.5 text-xs font-medium text-mantu-text focus:outline-none"
            >
              <option value={0}>All time</option>
              <option value={24}>Last 24 hours</option>
              <option value={168}>Last 7 days</option>
              <option value={720}>Last 30 days</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => loadDashboard(hours)} isLoading={isLoading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<CircleDollarSign className="h-5 w-5" />} label="Payments observed" value={payments?.totalPayments ?? 0} detail="Across all Mantu merchants" />
          <Metric icon={<ShieldAlert className="h-5 w-5" />} label="Fraud blocks" value={payments?.fraudBlockedPayments ?? 0} detail={percentage(payments?.fraudBlockedPayments ?? 0, payments?.totalPayments ?? 0)} tone="rose" />
          <Metric icon={<Route className="h-5 w-5" />} label="Smart-routed payments" value={payments?.routedPayments ?? 0} detail={`${percentage(payments?.routedPayments ?? 0, payments?.totalPayments ?? 0)} routing coverage`} tone="blue" />
          <Metric icon={<AlertTriangle className="h-5 w-5" />} label="Open anomaly alerts" value={dashboard?.anomalies.openAlerts ?? 0} detail={`${dashboard?.anomalies.criticalAlerts ?? 0} critical`} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card title="Smart-routing distribution" subtitle="Selected route volume in the monitoring window" className="lg:col-span-2">
            {isLoading ? <Loading /> : Object.keys(payments?.routeDistribution ?? {}).length === 0 ? <Empty text="No routed payments in this window." /> : (
              <div className="space-y-3">
                {Object.entries(payments?.routeDistribution ?? {}).map(([route, count]) => (
                  <div key={route} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-mantu-text">{route}</span><span className="font-semibold text-mantu-text">{count} payments</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title="Payment health" subtitle="Gateway outcomes and ML enforcement" className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Health label="Failed payments" value={payments?.failedPayments ?? 0} detail={percentage(payments?.failedPayments ?? 0, payments?.totalPayments ?? 0)} />
              <Health label="Fraud policy" value="Active" detail="High-risk blocks enabled" />
              <Health label="Models monitored" value="3" detail="Fraud, routing, anomaly" />
            </div>
          </Card>
        </div>

        <Card title="Recent anomaly alerts" subtitle="Highest-priority signals emitted by the anomaly detection service" action={<Badge variant="neutral">{dashboard?.recentAlerts.length ?? 0} recent</Badge>}>
          {isLoading ? <Loading /> : dashboard?.recentAlerts.length ? (
            <div className="divide-y divide-mantu-border">
              {dashboard.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex items-center gap-2"><span className="font-mono font-semibold text-mantu-text">{alert.id}</span><Badge variant={severity(alert.severity) as any} dot>{alert.severity}</Badge></div><p className="mt-1 text-mantu-muted">Merchant {alert.merchantId} · score {alert.anomalyScore} · {alert.modelVersion}</p></div>
                  <span className="font-mono text-[11px] text-mantu-muted">{new Date(alert.windowEnd).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <Empty text="No anomaly alerts were emitted in the current monitoring window." />}
        </Card>
      </main>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string | number; detail: string; tone?: 'rose' | 'blue' | 'amber' }> = ({ icon, label, value, detail, tone = 'blue' }) => (
  <Card><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-mantu-muted">{label}</p><p className="mt-2 text-2xl font-bold text-mantu-text">{value}</p><p className="mt-1 text-xs text-mantu-muted">{detail}</p></div><div className={`rounded p-2 ${tone === 'rose' ? 'bg-rose-50 text-rose-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-mantu-accent'}`}>{icon}</div></div></Card>
);
const Health: React.FC<{ label: string; value: string | number; detail: string }> = ({ label, value, detail }) => <div className="rounded border border-mantu-border bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase text-mantu-muted">{label}</p><p className="mt-1 text-lg font-bold text-mantu-text">{value}</p><p className="mt-1 text-[11px] text-mantu-muted">{detail}</p></div>;
const Loading = () => <div className="py-8 text-center text-xs text-mantu-muted"><Activity className="mr-2 inline h-4 w-4 animate-pulse" />Loading live monitoring data…</div>;
const Empty: React.FC<{ text: string }> = ({ text }) => <div className="py-8 text-center text-xs text-mantu-muted">{text}</div>;
