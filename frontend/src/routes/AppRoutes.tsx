import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { KycGuardRoute } from './KycGuardRoute';
import { AppShell } from '../components/layout/AppShell';

import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { KycOnboardingPage } from '../pages/kyc/KycOnboardingPage';
import { OverviewPage } from '../pages/dashboard/OverviewPage';
import { TransactionsPage } from '../pages/payments/TransactionsPage';
import { OrderCreationPage } from '../pages/payments/OrderCreationPage';
import { ApiKeysPage } from '../pages/developers/ApiKeysPage';
import { WebhooksPage } from '../pages/developers/WebhooksPage';
import { AnomalyAlertsPage } from '../pages/risk/AnomalyAlertsPage';
import { OpsReviewPage } from '../pages/ops/OpsReviewPage';
import { LandingPage } from '../pages/LandingPage';
import { useAuth } from '../context/AuthContext';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, merchantStatus, onboardingComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="app" element={<HomeRedirect />} />

        {/* KYC Onboarding (Always accessible to authenticated merchants) */}
        <Route path="onboarding/kyc" element={<KycOnboardingPage />} />

        {/* Features locked until KYC is approved */}
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
          path="risk-monitoring"
          element={
            <KycGuardRoute>
              <AnomalyAlertsPage />
            </KycGuardRoute>
          }
        />

        {/* Sandbox simulator & Ops review console */}
        <Route path="checkout-demo" element={<OrderCreationPage />} />
        <Route path="ops/kyc-review" element={<OpsReviewPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
