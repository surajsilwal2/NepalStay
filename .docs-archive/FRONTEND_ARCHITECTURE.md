# NepalStay Frontend Architecture & Optimization Plan

**Status**: Production-Ready Architecture Design  
**Version**: 1.0  
**Updated**: April 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Principles](#architecture-principles)
4. [Folder Structure (Standardized)](#folder-structure-standardized)
5. [Performance Optimization Strategy](#performance-optimization-strategy)
6. [Component System](#component-system)
7. [State Management](#state-management)
8. [Data Fetching & Caching](#data-fetching--caching)
9. [Role-Based UX Optimization](#role-based-ux-optimization)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

NepalStay is a production-grade Hotel Management System serving 4 distinct user roles:
- **Customers**: Browse, book, wishlist, track loyalty
- **Vendors**: Hotel management, inventory, analytics
- **Staff**: Operations, PMS, task execution
- **Admin**: Platform control, oversight, compliance

### Design Goals

✅ **Performance**: Sub-100ms TTFB, <3s TTI, <2s FCP  
✅ **Consistency**: Single design system across all roles  
✅ **Scalability**: Support 10k+ concurrent users  
✅ **UX**: Frictionless flows, predictable navigation  
✅ **Maintainability**: Clear component hierarchy, reusable utilities  

---

## Current State Analysis

### ✅ What's Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| **Next.js 14 Setup** | ✅ Excellent | App Router, Server Components enabled |
| **Authentication** | ✅ Working | NextAuth with multiple roles |
| **Database Schema** | ✅ Solid | Well-designed Prisma schema with relations |
| **Styling** | ✅ Good | Tailwind CSS with proper config |
| **Dynamic Imports** | ✅ Partial | Some components lazy-loaded (ChatWidget, CompareBar) |
| **Responsive Design** | ✅ Present | Mobile-first approach in place |

### ⚠️ Areas Needing Optimization

| Area | Current | Issue | Priority |
|------|---------|-------|----------|
| **Rendering Strategy** | Mixed | Some pages use client-side unnecessarily | HIGH |
| **Bundle Size** | Unknown | No analysis performed | HIGH |
| **API Data Flow** | Ad-hoc | Repeated fetch patterns, no caching | HIGH |
| **Component Reusability** | Low | Many one-off components | MEDIUM |
| **Layout System** | Manual | No standardized layout components | MEDIUM |
| **Error Handling** | Basic | Needs consistent patterns | MEDIUM |
| **Loading States** | Inconsistent | Mix of spinners, skeletons, placeholders | MEDIUM |
| **Code Splitting** | Minimal | Only critical components split | LOW |

### 🔍 Root Causes

1. **Monolithic Client Components**: Pages and dashboards are large client components
2. **No Component Library**: UI components scattered across codebase
3. **Fetch Pattern Issues**: Components fetching data directly (prop drilling)
4. **Missing Abstractions**: No standardized hooks for common patterns
5. **Layout Duplication**: Different roles use similar but slightly different layouts

---

## Architecture Principles

### Core Non-Negotiable Rules

```
PERFORMANCE > FEATURE_COMPLETENESS
CONSISTENCY > CREATIVITY
SCALABILITY > QUICK_FIXES
```

### Design Patterns

```
1. Server Components First
   - Default to server components for initial data fetch
   - Only use client components when interactivity needed
   - Streaming for faster perceived performance

2. Strict Component Boundaries
   - Each component has ONE responsibility
   - Props are stable (memoized)
   - No internal fetch/side effects in leaf components

3. Data Fetching at the Edge
   - Fetch at server level or route handler level
   - Pass data as props (no prop drilling)
   - Use React Query for client-side cache

4. Optimistic Updates
   - UI updates immediately on user action
   - Background sync ensures consistency
   - Graceful fallback on error

5. Pagination, Not Infinite Scroll
   - Better for performance (no DOM bloat)
   - Better for analytics (clearer sessions)
   - Better UX (users know where they are)
```

---

## Folder Structure (Standardized)

### Current vs. Recommended

```
BEFORE (Current):
────────────────
components/
  ├─ AvatarUploader.tsx (one-off)
  ├─ BookingModal.tsx (one-off)
  ├─ Navbar.tsx (mixed responsibilities)
  └─ features/ (loosely organized)

app/
  ├─ admin/ (monolithic pages)
  ├─ vendor/ (monolithic pages)
  ├─ customer/ (monolithic pages)
  └─ api/ (deeply nested routes)


AFTER (Recommended):
────────────────────
components/
  ├─ ui/                      # Pure, reusable UI components
  │   ├─ Button.tsx
  │   ├─ Card.tsx
  │   ├─ Modal.tsx
  │   ├─ Table.tsx
  │   ├─ Input.tsx
  │   ├─ Badge.tsx
  │   ├─ Avatar.tsx
  │   └─ Spinner.tsx
  │
  ├─ layout/                  # Role-agnostic layout system
  │   ├─ Navbar.tsx
  │   ├─ Sidebar.tsx
  │   ├─ DashboardLayout.tsx
  │   └─ PageContainer.tsx
  │
  ├─ shared/                  # Cross-cutting components
  │   ├─ hooks/
  │   │   ├─ useAsync.ts
  │   │   ├─ useOptimisticUpdate.ts
  │   │   ├─ usePagination.ts
  │   │   └─ useLocalStorage.ts
  │   ├─ forms/
  │   │   ├─ HotelForm.tsx
  │   │   ├─ BookingForm.tsx
  │   │   └─ useFormState.ts
  │   └─ loaders/
  │       ├─ CardSkeleton.tsx
  │       ├─ TableSkeleton.tsx
  │       └─ DashboardSkeleton.tsx
  │
  ├─ features/                # Feature-specific components (smart)
  │   ├─ hotel/
  │   │   ├─ HotelCard.tsx
  │   │   ├─ HotelGrid.tsx
  │   │   ├─ HotelFilters.tsx
  │   │   └─ HotelDetails.tsx
  │   ├─ booking/
  │   │   ├─ BookingFlow.tsx
  │   │   ├─ BookingSummary.tsx
  │   │   └─ BookingConfirmation.tsx
  │   ├─ chat/
  │   ├─ compare/
  │   ├─ payment/
  │   └─ ...
  │
  └─ providers/               # Context providers (already good)
      ├─ SessionProvider.tsx
      ├─ ToastContext.tsx
      └─ CalendarContext.tsx

app/
  ├─ (public)/                # Unauthenticated routes
  │   ├─ (auth)/
  │   │   ├─ login/
  │   │   └─ register/
  │   ├─ hotels/
  │   │   ├─ page.tsx (Server Component)
  │   │   ├─ [slug]/
  │   │   │   └─ page.tsx (Server Component)
  │   │   └─ loading.tsx
  │   └─ offline/
  │
  ├─ (authenticated)/         # Auth wall
  │   ├─ customer/
  │   │   ├─ layout.tsx (Dashboard layout)
  │   │   ├─ bookings/
  │   │   ├─ wishlist/
  │   │   └─ profile/
  │   ├─ vendor/
  │   │   ├─ layout.tsx (Dashboard layout)
  │   │   ├─ hotel/
  │   │   ├─ bookings/
  │   │   ├─ analytics/
  │   │   └─ pms/
  │   ├─ staff/
  │   │   ├─ layout.tsx (Dashboard layout)
  │   │   ├─ operations/
  │   │   └─ pms/
  │   └─ admin/
  │       ├─ layout.tsx (Dashboard layout)
  │       ├─ hotels/
  │       ├─ bookings/
  │       ├─ users/
  │       ├─ audit/
  │       └─ fnmis/
  │
  ├─ api/                     # API routes (flatter structure)
  │   ├─ public/ (unauthenticated)
  │   │   ├─ hotels/
  │   │   ├─ auth/
  │   │   └─ payment/
  │   ├─ private/ (authenticated)
  │   │   ├─ bookings/
  │   │   ├─ user/
  │   │   ├─ wishlist/
  │   │   └─ vendor/
  │   └─ admin/ (admin only)
  │       ├─ stats/
  │       ├─ users/
  │       └─ audit/
  │
  └─ shared/
      ├─ lib/
      │   ├─ api.ts (Unified API client)
      │   ├─ cache.ts (Caching strategy)
      │   ├─ validation.ts
      │   └─ constants.ts
      └─ types/
          ├─ index.ts
          ├─ entities.ts
          └─ api.ts

lib/
  ├─ (existing utilities stay, organized better)
  ├─ hooks/
  │   ├─ useApi.ts (React Query wrapper)
  │   ├─ useDebouncedValue.ts
  │   └─ useInfiniteScroll.ts
  └─ utils/
      ├─ formatting.ts
      ├─ validation.ts
      └─ constants.ts
```

---

## Performance Optimization Strategy

### 1. Rendering Optimization

#### Rule: Minimize Client-Side Rendering

**Current Issue**:
```tsx
// ❌ BAD: Entire page is client component
"use client";
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  // ... fetch in useEffect
}
```

**Solution**:
```tsx
// ✅ GOOD: Server component fetches, streams data
export default async function AdminDashboard() {
  const stats = await fetchStats(); // Server-side, parallel requests
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminContent stats={stats} />
    </Suspense>
  );
}

// Only interactive parts are client components
"use client";
function AdminContent({ stats }: { stats: Stats }) {
  // Minimal state, no fetching
  return <div>...</div>;
}
```

**Benefits**:
- Faster FCP (First Contentful Paint)
- Better SEO
- Lower JS bundle sent to client
- Secure API calls (no API keys exposed)

#### Implementation Timeline

- [ ] Convert admin dashboard to server component
- [ ] Convert vendor dashboard to server component
- [ ] Convert customer dashboard to server component
- [ ] Convert staff dashboard to server component

---

### 2. Bundle Size Optimization

#### Current Setup: Good
- Tailwind CSS (optimized)
- Lucide React (tree-shakeable)
- Next.js SWC minification

#### Additional Steps

```tsx
// ✅ Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('@/components/features/Charts'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Only needed if external dependencies
});

export default function Dashboard() {
  return <Charts />;
}
```

#### Metrics to Track

```bash
npm run build  # Check output
# Look for:
# - Server/client bundle sizes
# - Duplicate dependencies
# - Large chunks
```

---

### 3. Data Fetching Strategy

#### Old Pattern (❌ Avoid)
```tsx
"use client";
export default function Component() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);
}
```

**Problems**: 
- Duplicate fetches if component remounts
- No caching
- Waterfalls (fetch after render)
- Race conditions

#### New Pattern (✅ Recommended)

**Option 1: Server Component** (Fast, for initial load)
```tsx
export default async function Page() {
  const data = await fetch('http://localhost:3000/api/data', {
    next: { revalidate: 3600 } // ISR: revalidate every hour
  }).then(r => r.json());
  
  return <Content data={data} />;
}
```

**Option 2: React Query** (Client-side, for interactions)
```tsx
"use client";
import { useQuery } from '@tanstack/react-query';

export default function Component() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then(r => r.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  return <Content data={data} />;
}
```

#### When to Use What

| Scenario | Approach | Why |
|----------|----------|-----|
| Initial page load | Server Component | Faster, more secure |
| User interaction | React Query | Cached, reusable |
| Search filters | React Query | Debounced, optimized |
| Real-time updates | Websocket | Instant feedback |

---

### 4. Pagination Strategy

#### Old Pattern (❌ Avoid)
```tsx
// Infinite scroll - loads everything into DOM
const [bookings, setBookings] = useState([]);

useEffect(() => {
  fetch('/api/bookings')
    .then(r => r.json())
    .then(data => setBookings(data.items)); // All 10,000 items!
}, []);

return <List items={bookings} />;
```

#### New Pattern (✅ Recommended)

```tsx
"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function BookingsList() {
  const [page, setPage] = useState(1);
  const pageSize = 20; // Fixed size per page
  
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page],
    queryFn: () => 
      fetch(`/api/bookings?page=${page}&limit=${pageSize}`)
        .then(r => r.json()),
  });
  
  return (
    <>
      <BookingTable items={data?.items || []} />
      <Pagination 
        current={page}
        total={data?.total || 0}
        pageSize={pageSize}
        onChange={setPage}
      />
    </>
  );
}
```

**Benefits**:
- DOM has max 20 items (predictable memory)
- Fast page transitions
- Clear UX (users know page count)
- Analytics-friendly

---

## Component System

### UI Component Library (To Build)

#### Philosophy
- **Atomic**: Smallest reusable unit
- **Composable**: Build complex from simple
- **Accessible**: ARIA compliant
- **Themeable**: Consistent design tokens

#### Core Components

```tsx
// @/components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'font-medium rounded-lg transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Variants
        variant === 'primary' && 'bg-amber-600 text-white hover:bg-amber-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? '⏳' : children}
    </button>
  );
}
```

#### Design Tokens (Single Source of Truth)

```ts
// @/lib/designTokens.ts
export const COLORS = {
  // Role-based
  ADMIN: '#f59e0b',    // Amber (oversight)
  VENDOR: '#a855f7',   // Purple (control)
  STAFF: '#3b82f6',    // Blue (execution)
  CUSTOMER: '#10b981', // Green (buyer)
  
  // Semantic
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  
  // Neutral
  NEUTRAL: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    800: '#1f2937',
    900: '#111827',
  },
};

export const TYPOGRAPHY = {
  H1: 'text-3xl font-bold tracking-tight',
  H2: 'text-2xl font-semibold',
  H3: 'text-xl font-semibold',
  BODY: 'text-base text-slate-700',
  SMALL: 'text-sm text-slate-600',
  LABEL: 'text-sm font-medium',
};

export const SPACING = {
  // 8px grid
  0: '0',
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
};
```

---

## State Management

### Philosophy: Minimal, Explicit, Testable

#### Patterns by Scope

```
Global State (5-10% of app)
  ├─ User session (auth)
  ├─ Theme preference (light/dark)
  └─ Toast notifications

Page State (20-30% of app)
  ├─ Search filters
  ├─ Pagination
  └─ Sort order

Component State (60-70% of app)
  ├─ Form inputs
  ├─ Modal visibility
  └─ Local UI state
```

#### Implementation

```tsx
// Global: Use Context + Zustand for complex state
// @/components/providers/SessionProvider.tsx
import { createContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export const SessionContext = createContext(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

// Page State: Use URL search params (better UX)
// @/app/hotels/page.tsx
"use client";
import { useSearchParams, useRouter } from 'next/navigation';

export default function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const page = parseInt(searchParams.get('page') || '1');
  const city = searchParams.get('city') || '';
  
  const handleFilterChange = (city: string) => {
    // URL is source of truth, browser back/forward work
    router.push(`?city=${city}&page=1`);
  };
  
  return <HotelGrid city={city} page={page} />;
}

// Component State: Use useState + useCallback
"use client";
export function HotelFilters({ onApply }: { onApply: (filters) => void }) {
  const [selectedCity, setSelectedCity] = useState('');
  
  return (
    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
      {/* ... */}
    </select>
  );
}
```

---

## Data Fetching & Caching

### API Client Abstraction

```ts
// @/lib/api.ts
export class APIClient {
  async get<T>(endpoint: string, options = {}): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    
    return res.json();
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.get<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new APIClient();
```

### React Query Setup

```tsx
// @/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 10,   // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Usage

```tsx
// @/components/HotelGrid.tsx
"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function HotelGrid({ city, page }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hotels', city, page],
    queryFn: () => api.get(`/public/hotels?city=${city}&page=${page}`),
  });
  
  if (isLoading) return <HotelGridSkeleton />;
  if (error) return <ErrorMessage />;
  
  return <Grid items={data.items} />;
}
```

---

## Role-Based UX Optimization

### Admin Dashboard

**User Flow**: Monitor → Control → Approve  
**Performance Requirements**: 
- Load stats in <2s
- Search results <500ms
- Approvals <1s

**Optimizations**:
- Server-side data aggregation
- Paginated data tables
- Lazy-load charts
- Dedicated audit log UI

---

### Vendor Dashboard

**User Flow**: Monitor Revenue → Manage Bookings → Optimize Inventory  
**Performance Requirements**:
- Load hotel overview <1.5s
- Real-time booking updates
- Analytics <1s

**Optimizations**:
- Streaming for overview cards
- WebSocket for live bookings
- Chart lazy-loading
- PMS quick access

---

### Staff Dashboard

**User Flow**: Get Task → Execute → Update Status  
**Performance Requirements**:
- Minimal UI (no clutter)
- Quick action buttons
- Fast task fetch <500ms

**Optimizations**:
- Operation-focused UI
- Keyboard shortcuts
- Offline support
- Bulk actions

---

### Customer Dashboard

**User Flow**: Browse → Book → Track  
**Performance Requirements**:
- Search results <800ms
- Book confirmation <1s
- Loyalty points instant

**Optimizations**:
- Search debouncing
- Optimistic booking UI
- Loyalty display
- Personalized recommendations

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create component library (UI components)
- [ ] Set up design tokens
- [ ] Create shared hooks (useAsync, usePagination)
- [ ] Configure React Query

### Phase 2: Server Components (Week 2-3)
- [ ] Convert admin dashboard
- [ ] Convert vendor dashboard
- [ ] Convert customer dashboard
- [ ] Convert staff dashboard

### Phase 3: Layout System (Week 3)
- [ ] Create DashboardLayout
- [ ] Role-specific sidebars
- [ ] Consistent navbar

### Phase 4: Data Layer (Week 4)
- [ ] Unified API client
- [ ] Caching strategy
- [ ] Error handling patterns

### Phase 5: Polish (Week 5)
- [ ] Performance testing
- [ ] Lighthouse audit
- [ ] User testing
- [ ] Documentation

---

## Monitoring & Metrics

### Core Web Vitals

```
LCP (Largest Contentful Paint): < 2.5s ✅
FID (First Input Delay): < 100ms ✅
CLS (Cumulative Layout Shift): < 0.1 ✅
```

### Application Metrics

```
Time to Interactive: < 3s
First Contentful Paint: < 1.5s
Search response: < 800ms
API call: < 500ms
Component render: < 50ms
```

### Tools

- Lighthouse (Local)
- Vercel Analytics (Production)
- React DevTools Profiler (Development)

---

## Decision Log

### Why Server Components?
- **Faster initial load**: No JavaScript needed to render
- **Secure**: API calls don't expose credentials
- **SEO-friendly**: Full HTML from server
- **Less client-side code**: Smaller bundle

### Why Pagination > Infinite Scroll?
- **Predictable**: Users know page count
- **Better for analytics**: Clear session boundaries
- **Faster**: DOM stays small
- **Accessible**: Works without JS

### Why React Query over SWR?
- **More features**: Mutations, infinite queries, devtools
- **Better DX**: Explicit query keys
- **Production-ready**: Used by 1M+ developers
- **Excellent TypeScript**: Full type safety

### Why Not Redux/Zustand for Everything?
- **Unnecessary complexity**: Most state is UI-local
- **Hard to maintain**: State updates scattered
- **Bad for perf**: Global updates cause re-renders
- **Props are faster**: Explicit data flow

---

## Next Steps

1. **Review and Approve**: Verify this architecture matches requirements
2. **Implement Phase 1**: Start with component library
3. **Measure**: Track Core Web Vitals before/after
4. **Iterate**: Refine based on real-world data

---

**Questions?** Review specific sections or ask for implementation examples.
