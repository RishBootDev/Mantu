import { apiClient } from './client';
import {
  AnomalyAlertsResponse,
  KycDecisionRequest,
  OperationsRiskDashboard,
  OpsTransaction,
} from '../types/api';

const DEFAULT_ALERTS: AnomalyAlertsResponse = {
  items: [],
  page: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
};

export const internalApi = {
  async getRiskDashboard(hours = 0): Promise<OperationsRiskDashboard> {
    const res = await apiClient.get<OperationsRiskDashboard>(
      `/internal/ops/risk-dashboard?hours=${hours}`
    );
    return res.data;
  },

  async getOpsTransactions(limit = 200): Promise<OpsTransaction[]> {
    const res = await apiClient.get<OpsTransaction[]>(
      `/internal/ops/risk-dashboard/transactions?limit=${limit}`
    );
    return res.data;
  },

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
