import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BackendErrorResponse } from '../types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mantu_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-attach Idempotency key for payment/order POST operations
    if (
      config.method === 'post' &&
      (config.url?.includes('/payments') || config.url?.includes('/orders'))
    ) {
      if (!config.headers['X-Idempotency-Key']) {
        config.headers['X-Idempotency-Key'] = uuidv4();
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mantu_auth_token');
      // Only redirect if not already on login/signup page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    } else if (error.response?.data?.errorCode === 'KYC_REQUIRED') {
      if (!window.location.pathname.includes('/onboarding/kyc')) {
        window.location.href = '/onboarding/kyc';
      }
    }
    return Promise.reject(error);
  }
);
