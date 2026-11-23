import { apiClient } from './client';
import {
  ApiKeyResponse,
  ApiKeyCreateResponse,
  CreateApiKeyRequest,
} from '../types/api';

const DEFAULT_KEYS: ApiKeyResponse[] = [];

export const apiKeysApi = {
  async list(): Promise<ApiKeyResponse[]> {
    try {
      const res = await apiClient.get<ApiKeyResponse[]>('/v1/merchants/api-keys');
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const stored = localStorage.getItem('mantu_mock_keys');
        return stored ? JSON.parse(stored) : DEFAULT_KEYS;
      }
      throw err;
    }
  },

  async create(req: CreateApiKeyRequest): Promise<ApiKeyCreateResponse> {
    try {
      const res = await apiClient.post<ApiKeyCreateResponse>('/v1/merchants/api-keys', req);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const prefix = req.environment === 'TEST' ? 'mantu_test_' : 'mantu_live_';
        const randomKey = prefix + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        const randomSecret = 'sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const newKey: ApiKeyResponse = {
          id: `key_${Date.now()}`,
          keyId: randomKey,
          environment: req.environment,
          enabled: true,
          createdAt: new Date().toISOString(),
        };

        const existing = await this.list();
        localStorage.setItem('mantu_mock_keys', JSON.stringify([newKey, ...existing]));

        return {
          id: newKey.id,
          keyId: newKey.keyId,
          rawSecret: randomSecret,
          environment: req.environment,
        };
      }
      throw err;
    }
  },

  async rotate(keyId: string): Promise<ApiKeyCreateResponse> {
    try {
      const res = await apiClient.post<ApiKeyCreateResponse>(`/v1/merchants/api-keys/${keyId}/rotate`);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        const existing = await this.list();
        const target = existing.find((k) => k.keyId === keyId);
        const newSecret = 'sec_rot_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        if (target) {
          target.rotatedAt = new Date().toISOString();
          localStorage.setItem('mantu_mock_keys', JSON.stringify(existing));
        }

        return {
          id: target?.id || keyId,
          keyId: keyId,
          rawSecret: newSecret,
          environment: target?.environment || 'TEST',
        };
      }
      throw err;
    }
  },

  async revoke(keyId: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/merchants/api-keys/${keyId}`);
    } catch (err: any) {
      if (!err.response) {
        const existing = await this.list();
        const updated = existing.filter((k) => k.keyId !== keyId);
        localStorage.setItem('mantu_mock_keys', JSON.stringify(updated));
        return;
      }
      throw err;
    }
  },
};
