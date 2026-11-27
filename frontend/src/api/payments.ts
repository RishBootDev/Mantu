import { apiClient } from './client';
import {
  TokenizeCardRequest,
  TokenizeCardResponse,
  PaymentInitRequest,
  PaymentResponse,
} from '../types/api';

const DEFAULT_PAYMENTS: PaymentResponse[] = [];

export const paymentsApi = {
     
                                                                            
                                                                           
                                                                   
     
  getLocalDemoHistory(): PaymentResponse[] {
    const stored = localStorage.getItem('mantu_mock_payments');
    return stored ? JSON.parse(stored) : DEFAULT_PAYMENTS;
  },

  async list(): Promise<PaymentResponse[]> {
    try {
      const res = await apiClient.get<PaymentResponse[]>('/v1/payments');
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        return this.getLocalDemoHistory();
      }
      throw err;
    }
  },

  async tokenizeCard(req: TokenizeCardRequest): Promise<TokenizeCardResponse> {
    try {
      const res = await apiClient.post<TokenizeCardResponse>('/v1/vault/tokenize', req);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const cleanPan = req.pan.replace(/\s+/g, '');
        let brand = 'VISA';
        if (cleanPan.startsWith('5')) brand = 'MASTERCARD';
        else if (cleanPan.startsWith('3')) brand = 'AMEX';
        else if (cleanPan.startsWith('6')) brand = 'RUPAY';

        return {
          token: `tok_vlt_${Math.random().toString(36).substring(2, 12)}`,
          lastFour: cleanPan.slice(-4) || '1111',
          brand,
          expiryMonth: req.expiryMonth,
          expiryYear: req.expiryYear,
        };
      }
      throw err;
    }
  },

  async initiate(req: PaymentInitRequest): Promise<PaymentResponse> {
    try {
      const res = await apiClient.post<PaymentResponse>('/v1/payments', req);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
                                     
                                                                                   
        const isFraudSimulation =
          (req.method === 'UPI' && req.methodDetails.vpa?.toLowerCase().includes('fraud')) ||
          (req.method === 'CARD' && req.methodDetails.token?.includes('9999'));

        const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        
        let newPayment: PaymentResponse;

        const currentMerchantId = localStorage.getItem('mantu_merchant_id') || '';

        if (isFraudSimulation) {
          newPayment = {
            id: paymentId,
            orderId: req.orderId,
            merchantId: currentMerchantId,
            amount: { amountUnits: 50000, currency: 'INR' },
            status: 'FAILED',
            method: req.method,
            errorCode: 'FRAUD_HIGH_RISK',
            errorDescription: 'Transaction declined by ML Risk Engine (Score: 0.94 exceeds safe threshold)',
            createdAt: new Date().toISOString(),
          };
        } else {
          newPayment = {
            id: paymentId,
            orderId: req.orderId,
            merchantId: currentMerchantId,
            amount: { amountUnits: 50000, currency: 'INR' },
            status: 'CAPTURED',
            method: req.method,
            selectedRouteId: req.method === 'UPI' ? 'route_upi_primary' : 'route_hdfc_smart',
            methodDetails: req.methodDetails,
            capturedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
        }

        const existing = this.getLocalDemoHistory();
        localStorage.setItem('mantu_mock_payments', JSON.stringify([newPayment, ...existing]));
        return newPayment;
      }
      throw err;
    }
  },

  async capture(paymentId: string): Promise<PaymentResponse> {
    const res = await apiClient.post<PaymentResponse>(`/v1/payments/${paymentId}/capture`);
    return res.data;
  },
};
