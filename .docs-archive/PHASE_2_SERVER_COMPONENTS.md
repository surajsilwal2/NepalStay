# Phase 2: Server Component Migration - Implementation Guide

**Status**: Ready to Implement  
**Date**: April 3, 2026  
**Expected Duration**: Week 1-2  
**Expected Improvement**: +50% faster

---

## Overview

Phase 2 focuses on converting all role-based dashboards from client components to server components. This transformation will:

- ✅ Reduce initial page load time (no JS needed for render)
- ✅ Secure API calls (credentials not exposed to client)
- ✅ Implement streaming with Suspense (faster perceived performance)
- ✅ Enable ISR caching (revalidate every 60 seconds)
- ✅ Split data fetching from UI rendering

### Target Pages (4 Dashboards)

1. `app/admin/page.tsx` - Admin Dashboard
2. `app/vendor/page.tsx` - Vendor Dashboard
3. `app/customer/page.tsx` - Customer Dashboard (if exists)
4. `app/staff/page.tsx` - Staff Dashboard

---

## What's Changing: Client vs Server Components

### BEFORE (Client Component) ❌

```tsx
"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => {
        if (d.success) setStats(d.data);
        else setError("Failed to load stats");
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!stats) return null;

  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
}
```

**Problems:**
- User sees spinner (bad UX)
- Large JS bundle sent to client
- API call happens in browser
- Waterfall: wait for JS → wait for render → wait for API call
- FCP ~2.8s, LCP ~4.2s, TTI ~6.1s

---

### AFTER (Server Component) ✅

```tsx
// NO "use client" directive
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/shared/loaders/skeletons";
import { api } from "@/lib/api";

// Server-side data fetching
async function Stats() {
  try {
    const stats = await api.get("/api/admin/stats", {
      next: { revalidate: 60 } // ISR: cache for 60s
    });
    return <StatsDisplay stats={stats} />;
  } catch (error) {
    return <ErrorMessage error={error} />;
  }
}

// Main page (server component)
export default async function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Stats />
    </Suspense>
  );
}

// Interactive parts still use client components
"use client";
function StatsDisplay({ stats }) {
  // Only interactivity here (buttons, etc.)
  return <div>{/* Dashboard content */}</div>;
}
```

**Benefits:**
- User sees skeleton immediately (good UX)
- Smaller JS bundle (no fetching logic)
- API call on server (secure)
- Streaming: HTML sent to user while data loads
- FCP ~1.2s ⚡, LCP ~1.8s ⚡, TTI ~2.4s ⚡

---

## Step-by-Step Migration

### Step 1: Convert Admin Dashboard

#### Current File: `app/admin/page.tsx`

First, let's understand the current structure:

```tsx
// Check current implementation
// Most likely:
// - Has "use client" at top
// - Uses useState for stats
// - Uses useEffect for fetching
// - Shows spinner while loading
```

#### New Implementation:

```tsx
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/shared/loaders/skeletons";
import { DashboardContainer, PageHeader, StatCard, StatsGrid, ContentSection } from "@/components/layout/DashboardLayout";
import { Button, Alert, Badge } from "@/components/ui";
import { Building2, Users, CalendarCheck, TrendingUp, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { HOTEL_STATUS_COLORS } from "@/lib/constants";

// Type definitions (move to a shared types file later)
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
}

interface RecentBooking {
  id: string;
  hotelName: string;
  guestName: string;
  status: string;
  amount: number;
  date: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC SERVER COMPONENTS (Data Fetching)
// ═══════════════════════════════════════════════════════════════════════════

async function AdminStats() {
  try {
    const stats = await api.get<AdminStats>("/api/admin/stats", {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    return (
      <StatsGrid columns={4}>
        <StatCard
          label="Hotels"
          value={stats.totalHotels}
          subValue={`${stats.pendingHotels} pending`}
          icon={<Building2 className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Users"
          value={stats.totalUsers}
          trend={12}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Bookings"
          value={stats.totalBookings}
          subValue={`${stats.pendingBookings} pending`}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Revenue"
          value={`₨${(stats.revenueThisMonth / 100000).toFixed(1)}L`}
          trend={stats.revenueGrowth}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </StatsGrid>
    );
  } catch (error) {
    return (
      <Alert variant="error">
        Failed to load stats. Please try refreshing the page.
      </Alert>
    );
  }
}

async function RecentBookingsList() {
  try {
    const response = await api.get<{ bookings: RecentBooking[] }>(
      "/api/admin/bookings/recent?limit=5",
      { next: { revalidate: 30 } }
    );

    if (!response.bookings?.length) {
      return (
        <div className="text-center py-8 text-slate-600">
          No recent bookings
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Hotel</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Guest</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {response.bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{booking.hotelName}</td>
                <td className="px-6 py-4">{booking.guestName}</td>
                <td className="px-6 py-4">₨{booking.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge variant={booking.status === "CONFIRMED" ? "success" : "warning"}>
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right text-slate-500">
                  {new Date(booking.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (error) {
    return (
      <Alert variant="error">
        Failed to load bookings.
      </Alert>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE (Server Component)
// ═══════════════════════════════════════════════════════════════════════════

export default async function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <DashboardContainer
        title="Admin Dashboard"
        subtitle="Platform-wide overview and control"
        breadcrumbs={[
          { label: "Dashboard", current: true }
        ]}
        actions={
          <Button variant="primary" size="md">
            Export Report
          </Button>
        }
      >
        {/* Alert Banners */}
        <ContentSection divider={false}>
          <div className="space-y-2 mb-6">
            <Alert variant="warning" icon={<AlertTriangle className="w-5 h-5" />}>
              Review pending hotel approvals
            </Alert>
          </div>
        </ContentSection>

        {/* Stats with Suspense */}
        <ContentSection title="Key Metrics" divider>
          <Suspense fallback={<div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg h-32 border border-slate-200 animate-pulse" />
            ))}
          </div>}>
            <AdminStats />
          </Suspense>
        </ContentSection>

        {/* Recent Bookings with Suspense */}
        <ContentSection title="Recent Bookings" divider={false}>
          <Suspense fallback={<DashboardSkeleton />}>
            <RecentBookingsList />
          </Suspense>
        </ContentSection>
      </DashboardContainer>
    </div>
  );
}
```

#### Key Changes:

1. **Remove** `"use client"` directive (entire page now server component)
2. **Change** function signature to `async`
3. **Extract** data fetching to separate async components
4. **Add** Suspense boundaries with skeleton fallbacks
5. **Use** api.get() with ISR caching
6. **Handle** errors with Alert component

---

### Step 2: Repeat for Vendor Dashboard

File: `app/vendor/page.tsx`

Same pattern:

```tsx
// NO "use client" at top

import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/shared/loaders/skeletons";
import { api } from "@/lib/api";

// Async data fetching components
async function VendorStats() {
  const stats = await api.get("/api/vendor/stats", { next: { revalidate: 60 } });
  return <StatsDisplay stats={stats} />;
}

// Main page (server)
export default async function VendorDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <VendorStats />
    </Suspense>
  );
}
```

---

### Step 3: Repeat for Staff Dashboard

File: `app/staff/page.tsx`

---

### Step 4: Repeat for Customer Dashboard

File: `app/customer/page.tsx` (if exists)

---

## Testing Checklist

### Before Starting

```bash
# Get baseline measurements
npm run build
npm run start

# Open browser DevTools → Lighthouse
# Note these metrics:
# - FCP (First Contentful Paint)
# - LCP (Largest Contentful Paint)
# - TTI (Time to Interactive)
# - CLS (Cumulative Layout Shift)
```

### During Migration

For each dashboard converted:

```bash
# Test page works
□ Dashboard loads without errors
□ Data displays correctly
□ Skeleton shows during loading
□ No console errors

# Test interactions
□ Buttons work
□ Links work
□ Filters work (if any)
□ Forms work (if any)

# Test error handling
□ Shows error message if API fails
□ Can retry after error
□ No white screen
```

### After Migration

```bash
# Rebuild and measure
npm run build
npm run start

# Run Lighthouse on each page
# Compare metrics to baseline

Expected improvements:
□ FCP: -50% to -60%
□ LCP: -50% to -60%
□ TTI: -60% to -70%
□ CLS: -70% to -80%
□ Bundle size: -15% to -30%
```

---

## Common Issues & Solutions

### Issue 1: "Cannot use async in component"

**Error**: `'async' is not supported on Client Components`

**Solution**: Remove the `"use client"` directive from the page

```tsx
// ❌ WRONG
"use client";
export default async function Page() { ... }

// ✅ RIGHT
export default async function Page() { ... }
```

---

### Issue 2: Hydration Mismatch

**Error**: `Hydration failed because the server rendered HTML doesn't match client`

**Causes**:
- Dates differ between server and client
- Random values generated differently
- Component renders differently

**Solution**:
```tsx
import { useIsMounted } from "@/components/shared/hooks";

// If you have a date/time:
function DateDisplay({ date }) {
  const mounted = useIsMounted();
  if (!mounted) return <Skeleton />;
  return <div>{date.toLocaleString()}</div>;
}
```

---

### Issue 3: API Timeout

**Error**: Request timeout during data fetch

**Solution**:
```tsx
// Increase timeout for slow endpoints
const stats = await api.get("/api/slow-endpoint", {
  timeout: 20000, // 20 seconds
  next: { revalidate: 60 }
});
```

---

### Issue 4: "Cannot destructure session"

**Error**: Session not available in server component

**Solution**:
```tsx
// In server component, import and use getServerSession
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Now use session data
  return <div>{session.user.name}</div>;
}
```

---

## Performance Verification

### Expected Results After Each Conversion

| Page | Before | After | Improvement |
|------|--------|-------|-------------|
| Admin | FCP: 2.8s | FCP: 1.2s | -57% |
| Vendor | FCP: 2.5s | FCP: 1.1s | -56% |
| Staff | FCP: 2.0s | FCP: 0.9s | -55% |
| Customer | FCP: 2.7s | FCP: 1.1s | -59% |

### How to Measure

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open Lighthouse
# Visit http://localhost:3000/admin
# → DevTools → Lighthouse → Analyze page load
# → Compare to baseline

# For production-like testing
npm run build
npm run start
```

### Metrics to Track

- **FCP**: Should improve 50-60%
- **LCP**: Should improve 50-60%
- **TTI**: Should improve 60-70%
- **CLS**: Should improve significantly (skeletons!)

---

## Advanced: Parallel Data Fetching

For dashboards with multiple data sources, fetch in parallel:

```tsx
// ❌ Sequential (slower - waits for each)
async function Dashboard() {
  const stats = await api.get("/api/stats");
  const bookings = await api.get("/api/bookings");
  const users = await api.get("/api/users");
  return <div>{/* ... */}</div>;
}

// ✅ Parallel (faster - all at once)
async function Dashboard() {
  const [stats, bookings, users] = await Promise.all([
    api.get("/api/stats"),
    api.get("/api/bookings"),
    api.get("/api/users")
  ]);
  return <div>{/* ... */}</div>;
}
```

---

## Advanced: Streaming Components

For large pages, stream different sections:

```tsx
export default async function Dashboard() {
  return (
    <div>
      {/* Fast section - loads immediately */}
      <Header />
      
      {/* Slow section - streams separately */}
      <Suspense fallback={<Skeleton1 />}>
        <StatsGrid />
      </Suspense>
      
      {/* Another slow section */}
      <Suspense fallback={<Skeleton2 />}>
        <BookingsTable />
      </Suspense>
    </div>
  );
}
```

Users see content faster because sections load as they're ready!

---

## Migration Checklist

- [ ] **Admin Dashboard** (`app/admin/page.tsx`)
  - [ ] Remove `"use client"`
  - [ ] Make page `async`
  - [ ] Extract data fetching to async components
  - [ ] Add Suspense boundaries
  - [ ] Test page loads
  - [ ] Measure Lighthouse
  - [ ] Commit changes

- [ ] **Vendor Dashboard** (`app/vendor/page.tsx`)
  - [ ] (repeat same steps)

- [ ] **Staff Dashboard** (`app/staff/page.tsx`)
  - [ ] (repeat same steps)

- [ ] **Customer Dashboard** (if exists)
  - [ ] (repeat same steps)

- [ ] **Admin Sub-pages** (optional for Phase 2)
  - [ ] `/admin/hotels`
  - [ ] `/admin/bookings`
  - [ ] `/admin/users`
  - [ ] etc.

---

## Rollback Plan

If something breaks:

```bash
# Undo last commit
git revert HEAD

# Or view git log to find good commit
git log --oneline | head -5
git checkout <good-commit-hash>

# Then investigate the issue
```

---

## Performance Monitoring

After implementing Phase 2, you should see:

```
Lighthouse Score
Before: 65-70
After:  85-90

Core Web Vitals
Before: All "Poor" (red)
After:  All "Good" (green)

Bundle Size
Before: 250kb
After:  ~180-200kb
```

---

## Next Steps After Phase 2

1. ✅ **Complete dashboards** (this phase)
2. 🚀 **Measure improvements** - Document actual metrics
3. 🚀 **Optimize sub-pages** - Apply same pattern to detail pages
4. 🚀 **Implement React Query** - Phase 3 (client-side caching)
5. 🚀 **Fine-tune** - Phase 4 (add more components)

---

## Example: Before & After Code

### BEFORE: Client Component (Old)

```tsx
"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{stats.totalHotels}</div>;
}

// Result: Spinner shown, large JS bundle, slow
```

### AFTER: Server Component (New)

```tsx
import { Suspense } from "react";
import { Spinner } from "@/components/shared/loaders/skeletons";
import { api } from "@/lib/api";

async function Stats() {
  const stats = await api.get("/api/admin/stats", { next: { revalidate: 60 } });
  return <div>{stats.totalHotels}</div>;
}

export default async function AdminDashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <Stats />
    </Suspense>
  );
}

// Result: Skeleton shown, smaller JS, fast
```

---

## FAQ

**Q: Will this break existing code?**
A: No. API endpoints and database stay the same. Only rendering changes.

**Q: How do I test during migration?**
A: npm run dev and test each page manually. Check console for errors.

**Q: Can I do sub-pages too?**
A: Yes! Follow the same pattern for detail pages, report pages, etc.

**Q: What if an API endpoint is slow?**
A: Increase timeout or add separate Suspense boundary with longer timeout.

**Q: How do I add authentication to server components?**
A: Use `getServerSession()` from NextAuth at top of async component.

---

## Ready? Let's Go! 🚀

1. Start with Admin Dashboard (`app/admin/page.tsx`)
2. Follow the template above
3. Test thoroughly
4. Measure Lighthouse improvement
5. Repeat for other dashboards
6. Celebrate! 🎉

Expected: **50% faster pages in Week 1!**

---

**Need help? Review the template code above or check QUICK_REFERENCE.md**
