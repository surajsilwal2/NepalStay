'use client';

import React from 'react';
import { QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}
