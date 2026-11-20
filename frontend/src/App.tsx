import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import { ToastProvider } from './components/common/Toast';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EnvironmentProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </EnvironmentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
