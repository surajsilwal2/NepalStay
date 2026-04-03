# Phase 2 Implementation Checklist

**Status**: ✅ Ready to Start  
**Date**: April 3, 2026  
**Estimated Time**: 3-5 days per dashboard

---

## Quick Start (Do This First)

- [ ] Read `PHASE_2_SERVER_COMPONENTS.md` (this file)
- [ ] Open `app/admin/page.tsx` in editor
- [ ] Open the Admin Dashboard template above in another window
- [ ] Bookmark `QUICK_REFERENCE.md`

---

## Dashboard 1: Admin Dashboard (`app/admin/page.tsx`)

### Setup
- [ ] Read current file contents
- [ ] Identify what data is being fetched
- [ ] Identify what components are used
- [ ] Check if using authentication

### Conversion
- [ ] Remove `"use client"` from top
- [ ] Add `async` to default export
- [ ] Extract data fetching to separate async component functions
- [ ] Wrap fetching in try/catch with error handling
- [ ] Add Suspense boundaries with skeleton fallbacks
- [ ] Replace API calls with `api.get()` method
- [ ] Add ISR caching: `{ next: { revalidate: 60 } }`

### Testing
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000/admin`
- [ ] Verify page loads (should see skeleton briefly)
- [ ] Verify data displays correctly
- [ ] Check browser console for errors
- [ ] Check Network tab for API calls
- [ ] Test any interactive elements (buttons, filters, etc.)

### Performance
- [ ] Open DevTools → Lighthouse
- [ ] Run Lighthouse analysis
- [ ] Record: FCP, LCP, TTI, CLS scores
- [ ] Compare to baseline from Phase 1
- [ ] Take screenshot of results

### Completion
- [ ] Run `npm run build` (check for build errors)
- [ ] Git commit: `feat: convert admin dashboard to server component`
- [ ] Move to Dashboard 2

---

## Dashboard 2: Vendor Dashboard (`app/vendor/page.tsx`)

Follow same steps as Dashboard 1:

### Setup
- [ ] Read current file contents
- [ ] Identify data sources
- [ ] Identify components used

### Conversion
- [ ] Remove `"use client"`
- [ ] Make async
- [ ] Extract data fetching
- [ ] Add error handling
- [ ] Add Suspense + skeletons
- [ ] Use `api.get()` with ISR caching

### Testing
- [ ] Dev server: `npm run dev`
- [ ] Visit dashboard, verify loads
- [ ] Check console for errors
- [ ] Test interactions

### Performance
- [ ] Lighthouse analysis
- [ ] Record metrics
- [ ] Compare improvements

### Completion
- [ ] Git commit
- [ ] Move to Dashboard 3

---

## Dashboard 3: Staff Dashboard (`app/staff/page.tsx`)

Follow same steps as Dashboard 1:

- [ ] Setup
- [ ] Conversion
- [ ] Testing
- [ ] Performance measurement
- [ ] Git commit

---

## Dashboard 4: Customer Dashboard (if exists)

Check if `app/customer/page.tsx` exists:

- [ ] File exists? (Yes/No)
- [ ] If yes, follow same steps as Dashboard 1

---

## Sub-Dashboards (Optional for Phase 2)

If time permits, also convert:

### Admin Sub-pages

- [ ] `app/admin/hotels/page.tsx`
- [ ] `app/admin/bookings/page.tsx`
- [ ] `app/admin/users/page.tsx`
- [ ] `app/admin/reviews/page.tsx`
- [ ] `app/admin/audit/page.tsx`
- [ ] `app/admin/fnmis/page.tsx`

### Vendor Sub-pages

- [ ] `app/vendor/bookings/page.tsx`
- [ ] `app/vendor/hotel/page.tsx`
- [ ] `app/vendor/rooms/page.tsx`
- [ ] `app/vendor/reviews/page.tsx`
- [ ] `app/vendor/analytics/page.tsx`

### Staff Sub-pages

- [ ] `app/staff/pms/page.tsx`

---

## Common Errors & Quick Fixes

### Error: "'async' is not supported on Client Components"

**Fix**: Remove `"use client"` from top of file

```tsx
// ❌ WRONG
"use client";
export default async function Page() { ... }

// ✅ RIGHT
export default async function Page() { ... }
```

---

### Error: "Cannot find module '@/components/layout/DashboardLayout'"

**Fix**: This file was created in Phase 1. If missing:

```bash
git status  # Check if file exists
ls -la components/layout/
```

If missing, recreate from `PHASE_1_IMPLEMENTATION_GUIDE.md`

---

### Error: "API call fails"

**Fix**: Check API endpoint exists:

```bash
curl http://localhost:3000/api/admin/stats

# Or check route file exists
ls -la app/api/admin/stats/
```

---

### Error: "Hydration mismatch"

**Fix**: If showing dates/times, wrap in `useIsMounted()`:

```tsx
import { useIsMounted } from "@/components/shared/hooks";

function DateDisplay({ date }) {
  const mounted = useIsMounted();
  if (!mounted) return <Skeleton />;
  return <div>{date.toLocaleString()}</div>;
}
```

---

## Performance Baseline Reference

From Phase 1, your baseline should be:

**Current (Client Components)**
- FCP: ~2.5-2.8s ❌
- LCP: ~4.0-4.2s ❌
- TTI: ~6.0-6.1s ❌
- CLS: 0.1-0.15 ❌

**Expected After Phase 2 (Server Components)**
- FCP: ~1.1-1.2s ✅
- LCP: ~1.8-2.0s ✅
- TTI: ~2.3-2.5s ✅
- CLS: ~0.01-0.02 ✅

**Goal**: 50-60% improvement across all metrics

---

## Day-by-Day Plan

### Day 1: Admin Dashboard
- [ ] Morning: Read PHASE_2_SERVER_COMPONENTS.md
- [ ] Mid-morning: Start conversion
- [ ] Afternoon: Complete conversion + testing
- [ ] Evening: Lighthouse measurement

### Day 2: Vendor Dashboard
- [ ] Morning: Conversion
- [ ] Afternoon: Testing + measurement

### Day 3: Staff Dashboard
- [ ] Morning: Conversion
- [ ] Afternoon: Testing + measurement

### Day 4: Customer Dashboard (if needed)
- [ ] Morning: Conversion
- [ ] Afternoon: Testing + measurement

### Day 5: Sub-pages (optional)
- [ ] Optional: Start converting sub-pages
- [ ] Document findings

---

## Acceptance Criteria

Dashboard conversion is complete when:

- ✅ No `"use client"` at top of page
- ✅ Page function is `async`
- ✅ Data fetching in separate async components
- ✅ Suspense boundaries with skeleton fallbacks
- ✅ Error handling for failed API calls
- ✅ Uses `api.get()` method
- ✅ ISR caching configured: `{ next: { revalidate: 60 } }`
- ✅ `npm run build` succeeds
- ✅ Page loads without console errors
- ✅ All interactive elements work
- ✅ Lighthouse shows 50%+ improvement

---

## Deliverables to Produce

For each dashboard converted, create a brief report:

```markdown
## Admin Dashboard Migration Report

### Metrics
- FCP: 2.8s → 1.2s (-57%)
- LCP: 4.2s → 1.9s (-55%)
- TTI: 6.1s → 2.4s (-61%)
- CLS: 0.12 → 0.02 (-83%)

### Changes
- Removed "use client"
- Added async data fetching
- Added 2 Suspense boundaries
- Integrated api.get() with ISR

### Data Sources
- /api/admin/stats (60s cache)
- /api/admin/bookings/recent (30s cache)

### Issues Encountered
None - smooth conversion

### Rollout Date
[Date]
```

---

## Git Workflow

For each dashboard:

```bash
# 1. Create branch (optional but recommended)
git checkout -b feat/phase2-admin-server-component

# 2. Make changes
# ... edit app/admin/page.tsx ...

# 3. Test locally
npm run dev
# Visit http://localhost:3000/admin
# Test thoroughly

# 4. Build check
npm run build

# 5. Commit
git add .
git commit -m "feat: convert admin dashboard to server component

- Remove 'use client' directive
- Add async data fetching with ISR caching
- Add Suspense boundaries with skeleton fallbacks
- Expected 55-60% performance improvement"

# 6. If working in PR
git push origin feat/phase2-admin-server-component
# Then create PR on GitHub
```

---

## Troubleshooting Guide

### Page shows blank / no content

**Possible causes:**
1. API endpoint not working → Check `/api/admin/stats` exists
2. Error in async component → Check browser console
3. Hydration mismatch → Check for date/random values

**How to debug:**
```bash
# 1. Check console for errors
# DevTools → Console tab

# 2. Check network tab for failed requests
# DevTools → Network tab → look for red X

# 3. Check backend logs
# npm run dev → Terminal should show API errors

# 4. Verify component syntax
# All functions in async component must be properly defined
```

---

### Changes not showing up

**Possible causes:**
1. Dev server not restarted
2. File not saved
3. Module resolution issue

**How to fix:**
```bash
# Stop dev server (Ctrl+C)
npm run dev
# Dev server auto-compiles

# Or fully restart
npm run build
npm run start
```

---

### Build fails

**Possible causes:**
1. TypeScript errors
2. Missing imports
3. Syntax errors

**How to debug:**
```bash
npm run build
# Read error message carefully
# It will show exact file and line number

# Fix the issue and retry
npm run build
```

---

## Success Indicators

You'll know Phase 2 is complete when:

✅ All 4 main dashboards converted  
✅ No `"use client"` on main pages  
✅ Page functions are `async`  
✅ Data fetching uses `api.get()`  
✅ Suspense with skeletons in place  
✅ Lighthouse shows 50-60% improvement  
✅ No console errors  
✅ All interactive elements work  
✅ Build succeeds  

---

## Next: Phase 3 Planning

After Phase 2 complete:
- [ ] Document actual improvements achieved
- [ ] Plan React Query integration (Phase 3)
- [ ] Update metrics dashboard
- [ ] Team review of results

---

## Quick Links

- **Guide**: `PHASE_2_SERVER_COMPONENTS.md`
- **Reference**: `QUICK_REFERENCE.md`
- **Architecture**: `FRONTEND_ARCHITECTURE.md`
- **Example**: `components/layout/AdminDashboardExample.tsx`

---

**Ready? Start with Admin Dashboard! 🚀**

Questions? Check QUICK_REFERENCE.md first!
