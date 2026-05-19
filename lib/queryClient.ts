import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient configuration
 * Centralized cache management for all queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds before it becomes stale (was 5 min)
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch when user returns to the window so all dashboards stay fresh
      refetchOnWindowFocus: true,
      // Refetch in background when component mounts if stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
