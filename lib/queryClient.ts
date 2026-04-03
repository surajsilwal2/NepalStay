import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient configuration
 * Centralized cache management for all queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before it becomes stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus for slower connections
      refetchOnWindowFocus: false,
      // Refetch in background when component mounts only if stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
