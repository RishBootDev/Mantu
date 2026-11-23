import { apiClient } from './client';
import {
  CreateOrderRequest,
  OrderResponse,
} from '../types/api';

const DEFAULT_ORDERS: OrderResponse[] = [];

export const ordersApi = {
  /** The gateway catalog currently defines order creation, not order history. */
  getLocalDemoHistory(): OrderResponse[] {
    const stored = localStorage.getItem('mantu_mock_orders');
    return stored ? JSON.parse(stored) : DEFAULT_ORDERS;
  },

  async create(req: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const res = await apiClient.post<OrderResponse>('/v1/orders', req);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const randomId = 'ord_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        const newOrder: OrderResponse = {
          id: randomId,
          merchantId: localStorage.getItem('mantu_merchant_id') || '',
          receipt: req.receipt || `rcpt_${Date.now()}`,
          amount: req.amount,
          status: 'CREATED',
          attempts: 0,
          notes: req.notes,
          createdAt: new Date().toISOString(),
        };

        const existing = this.getLocalDemoHistory();
        localStorage.setItem('mantu_mock_orders', JSON.stringify([newOrder, ...existing]));
        return newOrder;
      }
      throw err;
    }
  },
};
