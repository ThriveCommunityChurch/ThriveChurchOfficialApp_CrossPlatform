import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from './ConfigProvider';
import { ThemeProvider } from './ThemeProvider';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime in v5)
    },
  },
});

export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={client}>
      <ConfigProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

