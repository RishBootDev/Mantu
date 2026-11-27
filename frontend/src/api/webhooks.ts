import { apiClient } from './client';
import {
  WebhookConfigResponse,
  UpdateWebhookConfigRequest,
} from '../types/api';

const DEFAULT_WEBHOOKS: WebhookConfigResponse[] = [];

function normalizeWebhook(raw: any): WebhookConfigResponse {
  const eventTypes: string[] = Array.isArray(raw.eventTypes)
    ? raw.eventTypes
    : typeof raw.eventTypes === 'string'
      ? raw.eventTypes
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

  return {
    id: raw.id,
    targetUrl: raw.targetUrl,
    enabled: Boolean(raw.enabled),
    eventTypes,
    rawSecret: raw.webhookSecret || raw.rawSecret || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const webhooksApi = {
  async list(): Promise<WebhookConfigResponse[]> {
    try {
      const res = await apiClient.get<any[]>('/v1/merchants/webhooks');
      return (res.data || []).map(normalizeWebhook);
    } catch (err: any) {
      if (!err.response) {
        const stored = localStorage.getItem('mantu_mock_webhooks');
        return stored ? JSON.parse(stored) : DEFAULT_WEBHOOKS;
      }
      throw err;
    }
  },

  async get(id: string): Promise<WebhookConfigResponse> {
    try {
      const res = await apiClient.get<any>(`/v1/merchants/webhooks/${id}`);
      return normalizeWebhook(res.data);
    } catch (err: any) {
      if (!err.response) {
        const list = await this.list();
        const found = list.find((w) => w.id === id);
        if (found) return found;
        throw new Error('Webhook not found');
      }
      throw err;
    }
  },

  async create(data: UpdateWebhookConfigRequest): Promise<WebhookConfigResponse> {
    try {
      const payload = {
        targetUrl: data.targetUrl,
        eventTypes: data.eventTypes.join(','),
      };
      const res = await apiClient.post<any>('/v1/merchants/webhooks', payload);
      return normalizeWebhook(res.data);
    } catch (err: any) {
      if (!err.response) {
        const secret = 'wbh_sec_' + Math.random().toString(36).substring(2, 16);
        const newWebhook: WebhookConfigResponse = {
          id: `wbh_${Date.now()}`,
          targetUrl: data.targetUrl,
          enabled: true,
          eventTypes: data.eventTypes,
          rawSecret: secret,
          createdAt: new Date().toISOString(),
        };

        const existing = await this.list();
        localStorage.setItem('mantu_mock_webhooks', JSON.stringify([newWebhook, ...existing]));
        return newWebhook;
      }
      throw err;
    }
  },

  async update(id: string, data: UpdateWebhookConfigRequest): Promise<WebhookConfigResponse> {
    try {
      const payload = {
        targetUrl: data.targetUrl,
        eventTypes: data.eventTypes.join(','),
      };
      const res = await apiClient.put<any>(`/v1/merchants/webhooks/${id}`, payload);
      return normalizeWebhook(res.data);
    } catch (err: any) {
      if (!err.response) {
        const existing = await this.list();
        const idx = existing.findIndex((w) => w.id === id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...data };
          localStorage.setItem('mantu_mock_webhooks', JSON.stringify(existing));
          return existing[idx];
        }
        throw new Error('Webhook not found');
      }
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/merchants/webhooks/${id}`);
    } catch (err: any) {
      if (!err.response) {
        const existing = await this.list();
        const updated = existing.filter((w) => w.id !== id);
        localStorage.setItem('mantu_mock_webhooks', JSON.stringify(updated));
        return;
      }
      throw err;
    }
  },
};
