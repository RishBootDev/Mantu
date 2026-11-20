import React, { createContext, useContext, useState, useEffect } from 'react';
import { MerchantStatus, KycCaseStatus, LoginResponse } from '../types/api';
import { kycApi } from '../api/kyc';

interface AuthState {
  token: string | null;
  merchantStatus: MerchantStatus;
  kycStatus: KycCaseStatus;
  onboardingComplete: boolean;
  businessName: string;
  email: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (res: LoginResponse, email?: string) => void;
  logout: () => void;
  refreshKycStatus: () => Promise<void>;
  updateBusinessName: (name: string) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mantu_auth_token'));
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus>(() => {
    return (localStorage.getItem('mantu_merchant_status') as MerchantStatus) || 'PENDING_KYC';
  });
  const [kycStatus, setKycStatus] = useState<KycCaseStatus>(() => {
    return (localStorage.getItem('mantu_kyc_status') as KycCaseStatus) || 'DRAFT';
  });
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem('mantu_onboarding_complete') === 'true';
  });
  const [email, setEmail] = useState<string>(() => localStorage.getItem('mantu_user_email') || 'alex@acmestore.com');
  const [businessName, setBusinessName] = useState<string>(() => localStorage.getItem('mantu_business_name') || 'Acme Retail Store');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      refreshKycStatus();
    }
  }, [token]);

  const updateBusinessName = (name: string) => {
    setBusinessName(name);
    localStorage.setItem('mantu_business_name', name);
  };

  const refreshKycStatus = async () => {
    try {
      setIsLoading(true);
      const res = await kycApi.getStatus();
      setMerchantStatus(res.merchantStatus);
      setKycStatus(res.kycStatus);
      setOnboardingComplete(res.onboardingComplete);
      localStorage.setItem('mantu_merchant_status', res.merchantStatus);
      localStorage.setItem('mantu_kyc_status', res.kycStatus);
      localStorage.setItem('mantu_onboarding_complete', String(res.onboardingComplete));
    } catch (err) {
      console.error('Failed to refresh KYC status', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (res: LoginResponse, userEmail?: string) => {
    setToken(res.token);
    setMerchantStatus(res.merchantStatus);
    setKycStatus(res.kycStatus);
    setOnboardingComplete(res.onboardingComplete);
    if (userEmail) setEmail(userEmail);

    localStorage.setItem('mantu_auth_token', res.token);
    localStorage.setItem('mantu_merchant_status', res.merchantStatus);
    localStorage.setItem('mantu_kyc_status', res.kycStatus);
    localStorage.setItem('mantu_onboarding_complete', String(res.onboardingComplete));
    if (userEmail) localStorage.setItem('mantu_user_email', userEmail);
  };

  const logout = () => {
    setToken(null);
    setMerchantStatus('PENDING_KYC');
    setKycStatus('DRAFT');
    setOnboardingComplete(false);
    localStorage.removeItem('mantu_auth_token');
    localStorage.removeItem('mantu_merchant_status');
    localStorage.removeItem('mantu_kyc_status');
    localStorage.removeItem('mantu_onboarding_complete');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        merchantStatus,
        kycStatus,
        onboardingComplete,
        businessName,
        email,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshKycStatus,
        updateBusinessName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
