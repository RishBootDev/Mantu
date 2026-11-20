import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  MerchantSignupRequest,
  MerchantResponse,
} from '../types/api';

export const authApi = {
  async signup(data: MerchantSignupRequest): Promise<MerchantResponse> {
    try {
      const res = await apiClient.post<MerchantResponse>('/v1/auth/signup', data);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        // Fallback demo response for standalone/local development
        const mock: MerchantResponse = {
          id: 'e4b2d56a-1153-4b62-9214-99d8d6f51cb3',
          name: data.name,
          email: data.email,
          businessName: data.businessName || 'Mantu Demo Enterprise',
          businessType: data.businessType || 'PRIVATE_LIMITED',
          status: 'PENDING_KYC',
          createdAt: new Date().toISOString(),
        };
        return mock;
      }
      throw err;
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const res = await apiClient.post<LoginResponse>('/v1/auth/login', data);
      return res.data;
    } catch (err: any) {
      if (!err.response) {
        // Fallback demo response for standalone/local development
        const isKycApproved = localStorage.getItem('demo_kyc_approved') === 'true';
        const mock: LoginResponse = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mantu_demo_token',
          merchantStatus: isKycApproved ? 'ACTIVE' : 'PENDING_KYC',
          kycStatus: isKycApproved ? 'APPROVED' : 'DRAFT',
          onboardingComplete: isKycApproved,
        };
        return mock;
      }
      throw err;
    }
  },
};
