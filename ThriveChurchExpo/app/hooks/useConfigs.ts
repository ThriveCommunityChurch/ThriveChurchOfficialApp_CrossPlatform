/**
 * useConfigs Hook
 * React hook for managing app configuration settings
 *
 * Note: For app-wide config initialization, use ConfigProvider instead.
 * This hook is useful for component-level config management.
 */

import { useEffect, useState } from 'react';
import { initializeConfigs } from '../services/api/configService';

interface UseConfigsResult {
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage app configs
 * Uses smart caching strategy - returns immediately if configs exist
 */
export const useConfigs = (options?: { autoFetch?: boolean }): UseConfigsResult => {
  const { autoFetch = true } = options || {};
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfigs = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeConfigs({ forceRefresh, silent: false });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch configs'));
      console.error('Error in useConfigs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchConfigs(false);
    }
  }, [autoFetch]);

  return {
    isLoading,
    error,
    refetch: () => fetchConfigs(true),
  };
};

