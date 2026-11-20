import React, { createContext, useContext, useState } from 'react';

type Environment = 'TEST' | 'LIVE';

interface EnvironmentState {
  environment: Environment;
  toggleEnvironment: () => void;
  setEnvironment: (env: Environment) => void;
  isTestMode: boolean;
}

const EnvironmentContext = createContext<EnvironmentState | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnv] = useState<Environment>(() => {
    return (localStorage.getItem('mantu_env') as Environment) || 'TEST';
  });

  const toggleEnvironment = () => {
    const next = environment === 'TEST' ? 'LIVE' : 'TEST';
    setEnv(next);
    localStorage.setItem('mantu_env', next);
  };

  const setEnvironment = (env: Environment) => {
    setEnv(env);
    localStorage.setItem('mantu_env', env);
  };

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        toggleEnvironment,
        setEnvironment,
        isTestMode: environment === 'TEST',
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};
