import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { KycGuardRoute } from './KycGuardRoute';
import { AppShell } from '../components/layout/AppShell';

import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { KycOnboardingPage } from '../pages/kyc/KycOnboardingPage';
import { KycVerifiedPage } from '../pages/kyc/KycVerifiedPage';
import { OverviewPage } from '../pages/dashboard/OverviewPage';
import { TransactionsPage } from '../pages/payments/TransactionsPage';
import { ApiKeysPage } from '../pages/developers/ApiKeysPage';
import { WebhooksPage } from '../pages/developers/WebhooksPage';
import { OpsReviewPage } from '../pages/ops/OpsReviewPage';
import { OpsRiskDashboardPage } from '../pages/ops/OpsRiskDashboardPage';
import { OpsTransactionsPage } from '../pages/ops/OpsTransactionsPage';
import { OpsGuardRoute } from './OpsGuardRoute';
import { LandingPage } from '../pages/LandingPage';
import { useAuth } from '../context/AuthContext';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, merchantStatus, onboardingComplete, isOpsAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isOpsAdmin) {
    return <Navigate to="/ops/risk" replace />;
  }

  if (merchantStatus === 'ACTIVE' && onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/onboarding/kyc" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {                        }
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {                                                                      }
      <Route
        path="/onboarding/kyc"
        element={
          <ProtectedRoute>
            <KycOnboardingPage />
          </ProtectedRoute>
        }
      />

      {                                     }
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="app" element={<HomeRedirect />} />

        {                                           }
        <Route
          path="dashboard"
          element={
            <KycGuardRoute>
              <OverviewPage />
            </KycGuardRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <KycGuardRoute>
              <TransactionsPage />
            </KycGuardRoute>
          }
        />
        <Route
          path="developers/api-keys"
          element={
            <KycGuardRoute>
              <ApiKeysPage />
            </KycGuardRoute>
          }
        />
        <Route
          path="developers/webhooks"
          element={
            <KycGuardRoute>
              <WebhooksPage />
            </KycGuardRoute>
          }
        />
        <Route
          path="kyc-verified"
          element={
            <KycGuardRoute>
              <KycVerifiedPage />
            </KycGuardRoute>
          }
        />
      </Route>

      {                                                 }
      <Route
        path="/ops/kyc-review"
        element={
          <ProtectedRoute>
            <OpsReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/ops/risk" element={<OpsGuardRoute><OpsRiskDashboardPage /></OpsGuardRoute>} />
      <Route path="/ops/transactions" element={<OpsGuardRoute><OpsTransactionsPage /></OpsGuardRoute>} />

      {                        }
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
