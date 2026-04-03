# Frontend Implementation Guide - Phase 1 Complete ✅

**Status**: Foundation Layer Complete  
**Date**: April 2026  
**Next Phase**: Server Component Migration

---

## What Was Built (Foundation Layer)

### 1. ✅ Design Tokens System (`lib/designTokens.ts`)

**Purpose**: Single source of truth for all styling decisions

**Includes**:
- Color palette (role-based + semantic)
- Typography scale (H1, H2, Body, etc.)
- Spacing system (8px grid)
- Border radius scale
- Shadows
- Transitions

**Usage**:
```tsx
import { COLORS, TYPOGRAPHY, SPACING } from '@/lib/designTokens';

// In components
<div className={`${TYPOGRAPHY.H1} text-[${COLORS.ADMIN}]`} />
// Or better: use these as reference for Tailwind classes
<div className="text-3xl font-bold text-amber-600" />
```

**Why**: Ensures visual consistency across ALL pages and roles. No more guessing colors or spacing.

---

### 2. ✅ Core UI Component Library (`components/ui/index.tsx`)

**Philosophy**: Atomic, composable, accessible

**Components Included**:
- `Button` - Multiple variants (primary, secondary, danger, ghost)
- `Card` - Reusable card container
- `Badge` - Status indicators
- `Spinner` - Loading indicator
- `Alert` - Notifications (info, success, warning, error)
- `Input` - Form input with label and error states
- `EmptyState` - Graceful empty state display

**Key Features**:
- Full TypeScript support
- Accessibility built-in (ARIA)
- Disabled states handled
- Loading states with spinners
- Responsive by default

**Why Build This**: Eliminates duplicate button/card/input code across dashboards. Every component follows the same design language.

---

### 3. ✅ Skeleton Loaders (`components/shared/loaders/skeletons.tsx`)

**Components Included**:
- `CardSkeleton` - Matches card height
- `TableRowSkeleton` - Table row placeholders
- `DashboardSkeleton` - Full dashboard mock
- `ListSkeleton` - List of items
- `GridSkeleton` - Grid layout mock

**Usage**:
```tsx
"use client";
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from '@/components/shared/loaders/skeletons';

export function MyDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()),
  });

  if (isLoading) return <DashboardSkeleton />;
  
  return <RealContent stats={data} />;
}
```

**Why**: Prevents layout shift (CLS = 0). Users see placeholder instantly instead of spinner.

---

### 4. ✅ Custom Hooks (`components/shared/hooks/index.ts`)

**Hooks Included**:

| Hook | Purpose | Example |
|------|---------|---------|
| `useDebounce` | Delay value updates (search, filters) | `const search = useDebounce(input, 300)` |
| `usePagination` | Pagination logic | `const { page, nextPage, goToPage } = usePagination({ total: 500 })` |
| `useLocalStorage` | Persist to browser storage | `const [theme, setTheme] = useLocalStorage('theme', 'light')` |
| `useAsync` | Simple data fetching | `const { data, loading } = useAsync(fetchData)` |
| `usePrevious` | Track previous value | `const prev = usePrevious(count)` |
| `useIsMounted` | Check mount status | `if (!useIsMounted()) return null` |
| `useToggle` | Boolean state toggle | `const [open, toggle] = useToggle(false)` |

**Why**: Extract common patterns, make them reusable and testable.

---

### 5. ✅ Constants System (`lib/constants/index.ts`)

**Organized Constants**:

```
ROLES                  → Customer, Vendor, Staff, Admin
BOOKING_STATUS         → Pending, Confirmed, Checked In, etc.
PAYMENT_METHODS        → Khalti, Cash, Stripe
HOTEL_STATUS           → Pending, Approved, Rejected, Suspended
ROOM_TYPES             → Single, Double, Suite, etc.
PAGINATION             → Default page size, max size
CACHE_DURATION         → Duration values for React Query
DEBOUNCE_DELAY         → Delay values for input debouncing
VALIDATION             → Regex patterns, min/max lengths
CURRENCY               → NPR, USD (with symbols)
```

**Usage**:
```tsx
import { ROLES, BOOKING_STATUS, PAGINATION } from '@/lib/constants';

// Type-safe
const userRole: typeof ROLES[keyof typeof ROLES] = 'ADMIN';

// Labels for UI
<span>{BOOKING_STATUS_LABELS[booking.status]}</span>

// Pagination logic
const { pageSize } = PAGINATION; // 20
```

**Why**: Single source of truth for all values. Type-safe. Easy to maintain.

---

### 6. ✅ Unified API Client (`lib/api.ts`)

**Features**:
- Centralized API calls (no scattered fetch calls)
- Automatic retry logic
- Request timeout handling
- Error handling (401, 403, 404, 429, 5xx)
- Response typing

**Usage**:
```tsx
import { api } from '@/lib/api';

// Simple GET
const hotels = await api.get('/public/hotels');

// Type-safe GET
const stats = await api.getTyped<Stats>('/admin/stats');

// POST with data
const booking = await api.post('/bookings', { hotelId, dates });

// PATCH
await api.patch('/bookings/123', { status: 'CONFIRMED' });

// DELETE
await api.delete('/reviews/123');
```

**Why**: 
- Consistent error handling everywhere
- Automatic retries on network failures
- No more error handling copy-paste
- Type-safe responses

---

## How to Use This Foundation

### Step 1: Import UI Components

```tsx
// @/app/admin/page.tsx
import { Button, Card, Badge, Spinner, Alert } from '@/components/ui';
import { DashboardSkeleton } from '@/components/shared/loaders/skeletons';

export function AdminDashboard() {
  return (
    <div className="space-y-4">
      {/* Use these instead of writing Tailwind manually */}
      <Button onClick={handleApprove}>Approve</Button>
      <Card>Content</Card>
      <Badge variant="success">Active</Badge>
    </div>
  );
}
```

### Step 2: Use Hooks for Common Logic

```tsx
// @/components/features/HotelSearch.tsx
"use client";
import { useDebounce, usePagination } from '@/components/shared/hooks';
import { PAGINATION } from '@/lib/constants';

export function HotelSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { page, nextPage, prevPage } = usePagination({
    total: 500,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  // Use debouncedSearch and page for API call
}
```

### Step 3: Fetch Data with API Client

```tsx
// @/app/admin/hotels/page.tsx
"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function HotelsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => api.getTyped('/public/hotels'),
  });

  if (isLoading) return <HotelGridSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <HotelGrid hotels={data} />;
}
```

---

## Next Steps: Phase 2 (Server Component Migration)

After this foundation is in place, we'll:

1. **Convert Admin Dashboard** to server component
2. **Convert Vendor Dashboard** to server component
3. **Convert Customer Dashboard** to server component
4. **Convert Staff Dashboard** to server component

Each conversion will:
- ✅ Move data fetching to server
- ✅ Replace with server components + streaming
- ✅ Keep UI as client components (interactive parts only)
- ✅ Use skeletons for loading states
- ✅ Measure performance improvements

---

## Performance Checklist

Before and after Phase 2, measure:

```bash
# Run Lighthouse locally
npm run build
npm run start
# Open browser → DevTools → Lighthouse → Analyze page load

# Key metrics:
□ LCP (Largest Contentful Paint): < 2.5s
□ FCP (First Contentful Paint): < 1.5s
□ TTI (Time to Interactive): < 3s
□ CLS (Cumulative Layout Shift): < 0.1
```

---

## File Structure Updated

```
✅ components/
   ├─ ui/
   │  └─ index.tsx (7 core components)
   ├─ shared/
   │  ├─ hooks/
   │  │  └─ index.ts (7 custom hooks)
   │  └─ loaders/
   │     └─ skeletons.tsx (5 skeleton components)
   └─ (existing features remain)

✅ lib/
   ├─ designTokens.ts (NEW - Design system)
   ├─ api.ts (NEW - Unified API client)
   ├─ constants/
   │  └─ index.ts (NEW - All constants)
   └─ (existing utilities remain)
```

---

## Key Principles Implemented

✅ **Performance First**
- Skeletons prevent layout shift
- API client handles caching/retries
- Debounce prevents excessive updates

✅ **Consistency**
- Single design system (tokens)
- Reusable components
- Constants prevent magic strings

✅ **Developer Experience**
- Type-safe (full TypeScript)
- Easy to use (simple APIs)
- Well-documented

✅ **Scalability**
- Components are composable
- Hooks are testable
- API client is extensible

---

## Common Patterns Going Forward

### Pattern 1: Fetch + Display (Server Component)
```tsx
// Fast, secure, SEO-friendly
export default async function Page() {
  const data = await api.get('/api/data');
  return <Content data={data} />;
}
```

### Pattern 2: Search + Pagination (Client Component)
```tsx
// With React Query caching
"use client";
const debouncedSearch = useDebounce(search, 300);
const { page, pageSize } = usePagination({ total });

const { data } = useQuery({
  queryKey: ['items', debouncedSearch, page],
  queryFn: () => api.get(`/api/items?q=${debouncedSearch}&page=${page}`),
});
```

### Pattern 3: Form Submission (Client Component)
```tsx
// Optimistic updates
"use client";
const mutation = useMutation({
  mutationFn: (data) => api.post('/api/bookings', data),
  onSuccess: () => queryClient.invalidateQueries(['bookings']),
});

<form onSubmit={(e) => {
  e.preventDefault();
  mutation.mutate(formData);
}}>
```

---

## Questions & Troubleshooting

**Q: Should I use all these components?**
A: Yes! They're designed to work together. Mix and match as needed.

**Q: Can I extend these components?**
A: Absolutely. They're just starting points. Add props as needed.

**Q: What about other UI components I need?**
A: Follow the same pattern - create in `components/ui/`, keep them simple and composable.

**Q: How do I add more constants?**
A: Add to `lib/constants/index.ts`. Export and use everywhere.

**Q: Can I use other component libraries?**
A: Yes, but these should be your primary choice for consistency. Avoid mixing libraries.

---

## Next Document: Phase 2 Migration Guide

Once you're comfortable with this foundation, I'll provide:
- ✅ Step-by-step server component conversion
- ✅ Streaming/Suspense patterns
- ✅ Performance measurements
- ✅ React Query setup guide
- ✅ Error boundary strategies

Ready to continue? Let me know! 🚀
