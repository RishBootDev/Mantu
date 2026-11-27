import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const KycGuardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { merchantStatus, onboardingComplete, isOpsAdmin } = useAuth();

  if (isOpsAdmin) {
    return <Navigate to="/ops/risk" replace />;
  }

  const isApproved = onboardingComplete && merchantStatus === 'ACTIVE';

  if (!isApproved) {
    return <Navigate to="/onboarding/kyc" replace />;
  }

  return <>{children}</>;
};
