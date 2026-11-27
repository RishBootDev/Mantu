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
                                                                  
        const mock: MerchantResponse = {
          id: '',
          name: data.name,
          email: data.email,
          businessName: data.businessName || '',
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
      const res = await apiClient.post<any>('/v1/auth/login', data);
      const token = res.data.token || res.data.accessToken || '';
      return {
        ...res.data,
        token,
        accessToken: token,
      };
    } catch (err: any) {
      if (!err.response) {
                                                                  
        const isKycApproved = localStorage.getItem('demo_kyc_approved') === 'true';
        const mock: LoginResponse = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mantu_demo_token',
          merchantStatus: isKycApproved ? 'ACTIVE' : 'PENDING_KYC',
          kycStatus: isKycApproved ? 'APPROVED' : 'DRAFT',
          onboardingComplete: isKycApproved,
          role: 'OWNER',
        };
        return mock;
      }
      throw err;
    }
  },
};
