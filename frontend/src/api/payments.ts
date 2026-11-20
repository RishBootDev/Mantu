import { apiClient } from './client';
import {
  TokenizeCardRequest,
  TokenizeCardResponse,
  PaymentInitRequest,
  PaymentResponse,
} from '../types/api';

const DEFAULT_PAYMENTS: PaymentResponse[] = [
  {
    id: 'pay_9b1deb4d3b7d4bad',
    orderId: 'ord_91a84f6457174562b3fc',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    amount: {
      amountUnits: 749900,
      currency: 'INR',
    },
    status: 'CAPTURED',
    method: 'CARD',
    selectedRouteId: 'route_hdfc_primary',
    methodDetails: { brand: 'VISA', lastFour: '4242' },
    capturedAt: '2026-11-16T11:42:15Z',
    createdAt: '2026-11-16T11:42:02Z',
  },
  {
    id: 'pay_87162fa910284ab9',
    orderId: 'ord_77e21a8829391039aafe',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    amount: {
      amountUnits: 129900,
      currency: 'INR',
    },
    status: 'CAPTURED',
    method: 'UPI',
    selectedRouteId: 'route_upi_axis_direct',
    methodDetails: { vpa: 'sarah.connor@okhdfcbank' },
    capturedAt: '2026-11-16T12:15:45Z',
    createdAt: '2026-11-16T12:15:32Z',
  },
  {
    id: 'pay_3fa01827b5244ca1',
    orderId: 'ord_3fa85f6457174562b3fc',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    amount: {
      amountUnits: 50000,
      currency: 'INR',
    },
    status: 'FAILED',
    method: 'CARD',
    selectedRouteId: 'route_icici_fallback',
    methodDetails: { brand: 'MASTERCARD', lastFour: '8812' },
    errorCode: 'FRAUD_HIGH_RISK',
    errorDescription: 'Transaction declined by ML Risk Engine (Score: 0.92 exceeds safe threshold)',
    createdAt: '2026-11-16T12:05:10Z',
  },
];

export const paymentsApi = {
  async list(): Promise<PaymentResponse[]> {
    try {
      const res = await apiClient.get<PaymentResponse[]>('/v1/payments');
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const stored = localStorage.getItem('mantu_mock_payments');
        return stored ? JSON.parse(stored) : DEFAULT_PAYMENTS;
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
        // ML Fraud Simulation Check:
        // If card last 4 ends in 9999 or UPI contains 'fraud', trigger fraud block
        const isFraudSimulation =
          (req.method === 'UPI' && req.methodDetails.vpa?.toLowerCase().includes('fraud')) ||
          (req.method === 'CARD' && req.methodDetails.token?.includes('9999'));

        const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        
        let newPayment: PaymentResponse;

        if (isFraudSimulation) {
          newPayment = {
            id: paymentId,
            orderId: req.orderId,
            merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
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
            merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
            amount: { amountUnits: 50000, currency: 'INR' },
            status: 'CAPTURED',
            method: req.method,
            selectedRouteId: req.method === 'UPI' ? 'route_upi_primary' : 'route_hdfc_smart',
            methodDetails: req.methodDetails,
            capturedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
        }

        const existing = await this.list();
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
