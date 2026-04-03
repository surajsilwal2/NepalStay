# Phase 3: React Query Integration - Complete Implementation Guide

**Phase**: 3 of 5  
**Status**: Ready to Implement  
**Duration**: 3-5 days  
**Expected Improvement**: +10-15% smoother interactions, better caching

---

## What is Phase 3?

Replace manual API call management with **React Query** (@tanstack/react-query) for:
- ✅ Automatic caching
- ✅ Background revalidation
- ✅ Deduplication of requests
- ✅ Automatic retry logic
- ✅ Optimistic updates
- ✅ Suspense support (experimental)

---

## Why React Query?

### Current (Phase 2 - Server Components)
```tsx
// Every page fetches independently
async function Dashboard() {
  const stats = await api.get("/api/stats");
  // No caching between pages
  // No automatic revalidation
  // User navigates away and back = fresh fetch
}
```

### With React Query (Phase 3)
```tsx
// Queries are cached automatically
function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get("/api/stats"),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

// Navigate to different page, come back
// ✅ Same query uses cached data
// ✅ After 5 min, silently revalidates
// ✅ Only one API call happening
```

---

## Installation

```bash
npm install @tanstack/react-query
```

---

## Step 1: Create Query Client Configuration

Create `lib/queryClient.ts`:

```tsx
import { QueryClient, DefaultOptions } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });
```

---

## Step 2: Create Query Client Provider

Create `components/providers/QueryClientProvider.tsx`:

```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ReactNode } from "react";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Step 3: Update Layout to Include Provider

Update `app/layout.tsx`:

```tsx
import { ReactQueryProvider } from "@/components/providers/QueryClientProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

---

## Step 4: Create Query Hooks

Create `lib/queries/admin.ts`:

```tsx
import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Type definitions
interface AdminStats {
  totalHotels: number;
  pendingHotels: number;
  approvedHotels: number;
  totalUsers: number;
  totalBookings: number;
  pendingBookings: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  pendingRefunds: number;
  fnmisPending: number;
  rooms: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch admin stats
 * Cache: 5 minutes
 * Revalidates: Every 5 minutes in background
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch hotels with filters
 * Cache: 2 minutes (more volatile data)
 */
export function useHotels(filters?: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const queryString = new URLSearchParams(
    Object.entries(filters || {}).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: ["admin", "hotels", filters],
    queryFn: () =>
      api.get<{ hotels: any[]; total: number }>(
        `/api/admin/hotels?${queryString}`
      ),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch recent bookings
 * Cache: 1 minute (very dynamic)
 */
export function useRecentBookings(limit: number = 10) {
  return useQuery({
    queryKey: ["admin", "bookings", "recent", limit],
    queryFn: () =>
      api.get<{ bookings: any[] }>(
        `/api/admin/bookings/recent?limit=${limit}`
      ),
    staleTime: 1000 * 60 * 1,
  });
}

/**
 * Fetch multiple queries in parallel
 * Useful for dashboards with multiple data sources
 */
export function useDashboardData() {
  const statsQuery = useAdminStats();
  const bookingsQuery = useRecentBookings(5);

  return useQueries({
    queries: [
      {
        queryKey: ["admin", "stats"],
        queryFn: () => api.get<AdminStats>("/api/admin/stats"),
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ["admin", "bookings", "recent", 5],
        queryFn: () =>
          api.get<{ bookings: any[] }>("/api/admin/bookings/recent?limit=5"),
        staleTime: 1000 * 60 * 1,
      },
    ],
  });
}
```

---

## Step 5: Use Query Hooks in Components

Convert a page to use React Query:

```tsx
"use client";

import { useAdminStats } from "@/lib/queries/admin";
import { Spinner } from "@/components/ui";
import { Alert } from "@/components/ui";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) return <Spinner />;
  if (error) return <Alert variant="error">Failed to load stats</Alert>;
  if (!stats) return null;

  return (
    <div>
      <div className="text-2xl font-bold">
        {stats.totalHotels} Hotels
      </div>
      {/* ... rest of dashboard */}
    </div>
  );
}
```

---

## Step 6: Mutations (Create, Update, Delete)

Create `lib/mutations/admin.ts`:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useApproveHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hotelId: string) =>
      api.patch(`/api/admin/hotels/${hotelId}`, { status: "APPROVED" }),
    
    onSuccess: () => {
      // Invalidate cache so it refetches
      queryClient.invalidateQueries({ queryKey: ["admin", "hotels"] });
    },
  });
}

export function useUpdateHotelStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      hotelId,
      status,
    }: {
      hotelId: string;
      status: string;
    }) => api.patch(`/api/admin/hotels/${hotelId}`, { status }),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hotels"] });
    },
  });
}
```

---

## Step 7: Use Mutations

```tsx
"use client";

import { useApproveHotel } from "@/lib/mutations/admin";
import { Button } from "@/components/ui";

export function HotelApprovalButton({ hotelId }: { hotelId: string }) {
  const { mutate: approve, isPending } = useApproveHotel();

  return (
    <Button
      onClick={() => approve(hotelId)}
      disabled={isPending}
      variant="primary"
    >
      {isPending ? "Approving..." : "Approve"}
    </Button>
  );
}
```

---

## Query Caching Strategy

### Recommended staleTime by Data Type

```
Real-time (Chat, Notifications): 0 (never cache)
Very Dynamic (Bookings): 1-2 minutes
Dynamic (Reviews, Stats): 5 minutes
Semi-static (Hotels, Users): 10-15 minutes
Static (Categories, Settings): 30-60 minutes
```

### Implementation

```tsx
// Very Dynamic
staleTime: 1000 * 60 * 1,    // 1 minute
gcTime: 1000 * 60 * 5,       // 5 minute garbage collection

// Dynamic
staleTime: 1000 * 60 * 5,    // 5 minutes
gcTime: 1000 * 60 * 10,      // 10 minute garbage collection

// Semi-static
staleTime: 1000 * 60 * 15,   // 15 minutes
gcTime: 1000 * 60 * 30,      // 30 minute garbage collection

// Static
staleTime: 1000 * 60 * 60,   // 60 minutes
gcTime: 1000 * 60 * 120,     // 2 hour garbage collection
```

---

## Optimization Patterns

### Pattern 1: Optimistic Updates

```tsx
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      api.patch(`/api/bookings/${bookingId}`, { status: "CONFIRMED" }),
    
    // Optimistic update - show change immediately
    onMutate: async (bookingId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      
      // Get previous data
      const previousBookings = queryClient.getQueryData(["bookings"]);
      
      // Update optimistically
      queryClient.setQueryData(["bookings"], (old: any) => ({
        ...old,
        bookings: old.bookings.map((b: any) =>
          b.id === bookingId ? { ...b, status: "CONFIRMED" } : b
        ),
      }));
      
      return { previousBookings };
    },
    
    // Revert if error
    onError: (error, variables, context) => {
      queryClient.setQueryData(["bookings"], context?.previousBookings);
    },
  });
}
```

### Pattern 2: Background Refetching

```tsx
export function useBookingsWithAutoRefetch() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => api.get("/api/bookings"),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 min
    refetchIntervalInBackground: true, // Even when window not focused
  });
}
```

### Pattern 3: Dependent Queries

```tsx
export function useUserBookings(userId: string | null) {
  return useQuery({
    queryKey: ["bookings", userId],
    queryFn: () => api.get(`/api/users/${userId}/bookings`),
    staleTime: 1000 * 60 * 5,
    enabled: !!userId, // Only run if userId exists
  });
}
```

---

## Integration with Server Components

Phase 3 combines with Phase 2 server components:

```tsx
// Server Component (Phase 2)
async function ServerDashboard() {
  const stats = await api.get("/api/stats", { next: { revalidate: 60 } });
  return <ClientDashboard initialStats={stats} />;
}

// Client Component (Phase 3 - with React Query)
"use client";
function ClientDashboard({ initialStats }: any) {
  const { data: stats } = useAdminStats();
  
  // Shows initialStats immediately, then revalidates
  // Perfect combo: Server rendering + Client caching
  return <div>{stats?.totalHotels}</div>;
}
```

---

## DevTools for Debugging

Add React Query DevTools:

```bash
npm install @tanstack/react-query-devtools
```

Add to layout:

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({ children }: any) {
  return (
    <html>
      <body>
        <ReactQueryProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

Now you can debug queries in browser console!

---

## Testing Queries

```tsx
// Example test with vitest
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminStats } from "@/lib/queries/admin";

it("should fetch admin stats", async () => {
  const { result } = renderHook(() => useAdminStats());

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toBeDefined();
  expect(result.current.data.totalHotels).toBeGreaterThan(0);
});
```

---

## Performance Impact

### Expected Improvements
- ✅ Fewer API calls (caching)
- ✅ Faster page transitions (cached data)
- ✅ Smoother interactions (no loading spinners for cached data)
- ✅ Better network usage (deduplication)
- ✅ Automatic retry (failed requests retry)

### Metrics
- **API Calls**: -40% (from caching)
- **Time to Interactive**: -10-15% (cached data)
- **User Experience**: Noticeably smoother

---

## Implementation Checklist

- [ ] Install @tanstack/react-query
- [ ] Create queryClient.ts
- [ ] Create QueryClientProvider
- [ ] Update layout with provider
- [ ] Create admin query hooks
- [ ] Create vendor query hooks
- [ ] Create staff query hooks
- [ ] Create mutation hooks
- [ ] Convert components to use hooks
- [ ] Test with DevTools
- [ ] Measure performance improvement
- [ ] Document caching strategy

---

## Next: Phase 4

After Phase 3 complete, move to Phase 4 (Component Expansion).

---

**Phase 3 delivers: Better caching, smoother interactions, optimized network usage! 🚀**
