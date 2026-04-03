import { useQuery, useQueries } from '@tanstack/react-query';

/**
 * Type definitions for admin queries
 */
interface AdminStats {
  totalHotels: number;
  pendingApprovals: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  growthPercentage: number;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  status: 'approved' | 'pending' | 'rejected';
  bookings: number;
  revenue: number;
}

interface RecentBooking {
  id: string;
  hotelName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface HotelFilters extends PaginationParams {
  status?: 'approved' | 'pending' | 'rejected' | 'all';
  search?: string;
}

/**
 * Fetch admin dashboard statistics
 * Cached for 5 minutes (default staleTime)
 */
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch admin stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch hotels list with filters
 * Cached for 2 minutes (more volatile data)
 */
export function useHotels(filters: HotelFilters = {}) {
  const queryString = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 10),
    status: filters.status || 'all',
    search: filters.search || '',
    sortBy: filters.sortBy || 'createdAt',
    order: filters.order || 'desc',
  }).toString();

  return useQuery<{ hotels: Hotel[]; total: number }>({
    queryKey: ['admin', 'hotels', filters],
    queryFn: async () => {
      const response = await fetch(`/api/admin/hotels?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch hotels');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch recent bookings
 * Cached for 1 minute (real-time data)
 */
export function useRecentBookings(limit: number = 10) {
  return useQuery<RecentBooking[]>({
    queryKey: ['admin', 'bookings', 'recent', limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/bookings?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recent bookings');
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch pending approvals
 * Cached for 2 minutes
 */
export function usePendingApprovals(limit: number = 5) {
  return useQuery<Hotel[]>({
    queryKey: ['admin', 'approvals', 'pending', limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/hotels?status=pending&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch pending approvals');
      const data = await response.json();
      return data.hotels;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch all dashboard data in parallel
 * Optimized: uses useQueries for better performance
 */
export function useDashboardData() {
  return useQueries({
    queries: [
      {
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
          const response = await fetch('/api/admin/stats');
          if (!response.ok) throw new Error('Failed to fetch stats');
          return response.json();
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['admin', 'hotels', { status: 'all' }],
        queryFn: async () => {
          const response = await fetch('/api/admin/hotels?status=all&limit=10');
          if (!response.ok) throw new Error('Failed to fetch hotels');
          return response.json();
        },
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ['admin', 'bookings', 'recent', 10],
        queryFn: async () => {
          const response = await fetch('/api/admin/bookings?limit=10');
          if (!response.ok) throw new Error('Failed to fetch bookings');
          return response.json();
        },
        staleTime: 1 * 60 * 1000,
      },
    ],
  });
}

/**
 * Fetch hotel analytics
 * Cached for 10 minutes (analytics are less time-sensitive)
 */
export function useHotelAnalytics(hotelId: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', hotelId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/hotels/${hotelId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!hotelId,
  });
}

/**
 * Fetch admin audit logs
 * Cached for 5 minutes
 */
export function useAuditLogs(filters?: { userId?: string; action?: string; limit?: number }) {
  const queryString = new URLSearchParams({
    userId: filters?.userId || '',
    action: filters?.action || '',
    limit: String(filters?.limit || 50),
  }).toString();

  return useQuery({
    queryKey: ['admin', 'audit', filters],
    queryFn: async () => {
      const response = await fetch(`/api/admin/audit?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
