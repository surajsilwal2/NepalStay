'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/providers/ToastContext';

interface MutationResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Approve a hotel for listing
 */
export function useApproveHotel() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<MutationResponse, Error, { hotelId: string; notes?: string }>({
    mutationFn: async ({ hotelId, notes }) => {
      const response = await fetch(`/api/admin/hotels/${hotelId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to approve hotel');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries so they refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      toast.success('Hotel approved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve hotel');
    },
  });
}

/**
 * Reject a hotel application
 */
export function useRejectHotel() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<MutationResponse, Error, { hotelId: string; reason: string }>({
    mutationFn: async ({ hotelId, reason }) => {
      const response = await fetch(`/api/admin/hotels/${hotelId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject hotel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      toast.success('Hotel rejected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject hotel');
    },
  });
}

/**
 * Update hotel status (suspend, activate, etc)
 */
export function useUpdateHotelStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<
    MutationResponse,
    Error,
    { hotelId: string; status: 'active' | 'suspended' | 'inactive' }
  >({
    mutationFn: async ({ hotelId, status }) => {
      const response = await fetch(`/api/admin/hotels/${hotelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update hotel status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Hotel status updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

/**
 * Process refund for a booking
 */
export function useProcessRefund() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<
    MutationResponse,
    Error,
    { bookingId: string; amount: number; reason: string }
  >({
    mutationFn: async ({ bookingId, amount, reason }) => {
      const response = await fetch(`/api/admin/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount, reason }),
      });
      if (!response.ok) throw new Error('Failed to process refund');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Refund processed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process refund');
    },
  });
}

/**
 * Update user role or permissions
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<
    MutationResponse,
    Error,
    { userId: string; role: 'admin' | 'vendor' | 'staff' | 'customer' }
  >({
    mutationFn: async ({ userId, role }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

/**
 * Create promotional offer
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<
    MutationResponse,
    Error,
    {
      title: string;
      description: string;
      discountPercentage: number;
      validFrom: string;
      validTo: string;
    }
  >({
    mutationFn: async (offerData) => {
      const response = await fetch(`/api/admin/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });
      toast.success('Offer created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create offer');
    },
  });
}

/**
 * Send notification to users
 */
export function useSendNotification() {
  const toast = useToast();

  return useMutation<
    MutationResponse,
    Error,
    {
      title: string;
      message: string;
      recipients: 'all' | 'admins' | 'vendors' | string[];
    }
  >({
    mutationFn: async (notificationData) => {
      const response = await fetch(`/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Notification sent successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send notification');
    },
  });
}
