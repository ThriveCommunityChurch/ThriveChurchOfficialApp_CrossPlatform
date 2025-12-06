/**
 * ConfigProvider
 * Manages app configuration loading and initialization
 * Matches iOS behavior: loads configs on app startup
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { initializeConfigs, hasConfigs } from '../services/api/configService';

interface ConfigContextValue {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  hasConfigs: boolean;
  refetchConfigs: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [configsExist, setConfigsExist] = useState(false);

  const loadConfigs = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await initializeConfigs({ 
        forceRefresh,
        silent: false 
      });

      console.log('Config initialization result:', result);

      // Check if configs exist after initialization
      const exists = await hasConfigs();
      setConfigsExist(exists);
      setIsInitialized(true);

      if (!exists && !result.fetchedFresh) {
        console.warn('No configs available after initialization');
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load configs');
      setError(errorObj);
      console.error('Config initialization error:', errorObj);

      // Even if fetch fails, check if we have cached configs
      const exists = await hasConfigs();
      setConfigsExist(exists);
      setIsInitialized(true);

      if (exists) {
        console.log('Using cached configs despite initialization error');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchConfigs = useCallback(async () => {
    await loadConfigs(true);
  }, [loadConfigs]);

  useEffect(() => {
    // Initialize configs on app startup (matches iOS AppDelegate behavior)
    console.log('ConfigProvider: Initializing configs on app startup...');
    loadConfigs(false);
  }, [loadConfigs]);

  const value: ConfigContextValue = useMemo(() => ({
    isInitialized,
    isLoading,
    error,
    hasConfigs: configsExist,
    refetchConfigs,
  }), [isInitialized, isLoading, error, configsExist, refetchConfigs]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

