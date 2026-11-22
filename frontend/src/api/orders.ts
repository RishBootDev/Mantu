import { apiClient } from './client';
import {
  CreateOrderRequest,
  OrderResponse,
} from '../types/api';

const DEFAULT_ORDERS: OrderResponse[] = [
  {
    id: 'ord_91a84f6457174562b3fc',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    customerId: 'cust_8ac72341112233',
    receipt: 'rcpt_inv_1092',
    amount: {
      amountUnits: 749900,
      currency: 'INR',
    },
    status: 'PAID',
    attempts: 1,
    notes: { product: 'Cloud Dedicated Node - Annual' },
    createdAt: '2026-11-16T11:42:00Z',
  },
  {
    id: 'ord_3fa85f6457174562b3fc',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    customerId: 'cust_9876543210aa',
    receipt: 'order_rcptid_11',
    amount: {
      amountUnits: 50000,
      currency: 'INR',
    },
    status: 'CREATED',
    attempts: 0,
    notes: { product: 'Nike Air Max 90', color: 'Black' },
    createdAt: '2026-11-16T12:00:00Z',
  },
  {
    id: 'ord_77e21a8829391039aafe',
    merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
    customerId: 'cust_5544332211bb',
    receipt: 'rcpt_sub_441',
    amount: {
      amountUnits: 129900,
      currency: 'INR',
    },
    status: 'PAID',
    attempts: 1,
    notes: { product: 'Pro Developer Tier - Monthly' },
    createdAt: '2026-11-16T12:15:30Z',
  },
];

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
          merchantId: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
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
