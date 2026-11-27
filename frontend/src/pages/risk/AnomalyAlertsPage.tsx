import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { internalApi } from '../../api/internal';
import { AnomalyAlertsResponse } from '../../types/api';
import { useToast } from '../../components/common/Toast';

export const AnomalyAlertsPage: React.FC = () => {
  const [alertsData, setAlertsData] = useState<AnomalyAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await internalApi.getAnomalyAlerts();
      setAlertsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const getSeverityBadge = (sev: string) => {
    if (sev === 'CRITICAL') return <Badge variant="error" dot>CRITICAL</Badge>;
    if (sev === 'HIGH') return <Badge variant="warning" dot>HIGH</Badge>;
    if (sev === 'MEDIUM') return <Badge variant="warning" dot>MEDIUM</Badge>;
    return <Badge variant="neutral">LOW</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">ML Risk & Anomaly Monitoring</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Real-time inference signals from FastAPI ML microservice screening live transaction velocity & failure spikes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAlerts}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Feed
        </Button>
      </div>

      {                       }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-mantu-border shadow-card flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-mantu-accent">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-mantu-muted uppercase font-semibold">Active ML Model</div>
            <div className="text-xs font-mono font-bold text-mantu-text">mantu_anomaly_v2.1_fastapi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-mantu-muted uppercase font-semibold">Inference Latency</div>
            <div className="text-xs font-mono font-bold text-emerald-700">18.4ms (p99)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-mantu-border shadow-card flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-mantu-muted uppercase font-semibold">Open Critical Flags</div>
            <div className="text-xs font-mono font-bold text-rose-700">
              {alertsData?.items.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length || 0} Alerts
            </div>
          </div>
        </div>
      </div>

      {                        }
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-mantu-text">Detected Anomalies</h3>

        {isLoading ? (
          <Card>
            <div className="text-center py-8 text-mantu-muted text-xs">
              Loading real-time anomaly alerts...
            </div>
          </Card>
        ) : !alertsData || alertsData.items.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-mantu-muted text-xs">
              No anomaly alerts triggered in the current observation window.
            </div>
          </Card>
        ) : (
          alertsData.items.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 bg-white rounded border shadow-card transition-all ${
                alert.severity === 'CRITICAL' ? 'border-l-4 border-l-rose-600' : 'border-mantu-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-mantu-border">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-mantu-text">{alert.id}</span>
                  {getSeverityBadge(alert.severity)}
                  <span className="font-mono text-[11px] text-mantu-muted">
                    Risk Score: <strong className="text-mantu-text">{alert.anomalyScore}</strong>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-mantu-muted">
                  Window: {new Date(alert.windowStart).toLocaleTimeString()} – {new Date(alert.windowEnd).toLocaleTimeString()}
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] uppercase font-semibold text-mantu-muted block mb-1">
                  ML Feature Explanations:
                </span>
                <ul className="space-y-1">
                  {alert.explanation.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-mantu-text">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 pt-3 border-t border-mantu-border flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-mantu-muted">
                  Merchant: {alert.merchantId} • Engine: {alert.modelVersion}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      alert.status = 'DISMISSED';
                      showToast(`Alert ${alert.id} dismissed`, 'info');
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
