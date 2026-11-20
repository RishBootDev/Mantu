import { apiClient } from './client';
import {
  AnomalyAlertsResponse,
  KycDecisionRequest,
} from '../types/api';

const DEFAULT_ALERTS: AnomalyAlertsResponse = {
  items: [
    {
      id: 'alert_ml_88192',
      merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
      windowStart: '2026-11-16T12:00:00Z',
      windowEnd: '2026-11-16T12:05:00Z',
      anomalyScore: 0.88,
      severity: 'CRITICAL',
      modelVersion: 'mantu_anomaly_v2.1_fastapi',
      status: 'OPEN',
      explanation: [
        'Failure rate spike detected (65% failure vs 3.2% historical baseline)',
        'Abnormal transaction velocity (42 card attempts in 180 seconds from single subnet)',
        'High card expiration error frequency',
      ],
    },
    {
      id: 'alert_ml_88185',
      merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
      windowStart: '2026-11-16T11:40:00Z',
      windowEnd: '2026-11-16T11:45:00Z',
      anomalyScore: 0.64,
      severity: 'HIGH',
      modelVersion: 'mantu_anomaly_v2.1_fastapi',
      status: 'REVIEWED',
      explanation: [
        'Average ticket size deviated +340% from typical 30-day merchant mean',
        'Geo-velocity discrepancy across consecutive UPI handles',
      ],
    },
    {
      id: 'alert_ml_88170',
      merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
      windowStart: '2026-11-16T10:15:00Z',
      windowEnd: '2026-11-16T10:20:00Z',
      anomalyScore: 0.42,
      severity: 'MEDIUM',
      modelVersion: 'mantu_anomaly_v2.1_fastapi',
      status: 'DISMISSED',
      explanation: [
        'Short latency fluctuation on secondary routing gateway (Axis Bank direct)',
      ],
    },
  ],
  page: 0,
  size: 50,
  totalElements: 3,
  totalPages: 1,
};

export const internalApi = {
  async getAnomalyAlerts(page = 0, size = 50): Promise<AnomalyAlertsResponse> {
    try {
      const res = await apiClient.get<AnomalyAlertsResponse>(
        `/internal/anomaly-alerts?page=${page}&size=${size}`
      );
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const stored = localStorage.getItem('mantu_mock_alerts');
        return stored ? JSON.parse(stored) : DEFAULT_ALERTS;
      }
      throw err;
    }
  },

  async submitKycDecision(token: string, req: KycDecisionRequest): Promise<void> {
    try {
      await apiClient.post(`/internal/kyc/review/${token}/decision`, req);
    } catch (err: any) {
      if (!err.response) {
        // In local mock mode, apply the decision to the local merchant state
        const storedKyc = localStorage.getItem('mantu_mock_kyc');
        if (storedKyc) {
          const kyc = JSON.parse(storedKyc);
          kyc.kycStatus = req.decision;
          kyc.reviewerNote = req.note || null;
          if (req.decision === 'APPROVED') {
            kyc.merchantStatus = 'ACTIVE';
            kyc.onboardingComplete = true;
            localStorage.setItem('demo_kyc_approved', 'true');
          } else {
            kyc.merchantStatus = 'PENDING_KYC';
            kyc.onboardingComplete = false;
            localStorage.removeItem('demo_kyc_approved');
          }
          localStorage.setItem('mantu_mock_kyc', JSON.stringify(kyc));
        }
        return;
      }
      throw err;
    }
  },
};
