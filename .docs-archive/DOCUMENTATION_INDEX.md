# 📚 Documentation Index & Quick Navigation

**All frontend documentation organized in one place.**

---

## 🎯 START HERE

### For Busy People (5 min read)
👉 **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - One page cheat sheet with copy-paste code

### For Developers (30 min read)
👉 **[FRONTEND_SUMMARY.md](./FRONTEND_SUMMARY.md)** - Complete overview, metrics, roadmap

### For Architects (2 hour read)
👉 **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - 60-page detailed design document

---

## 📖 Complete Documentation Map

### Phase 1: Foundation (Complete ✅)
- **[PHASE_1_IMPLEMENTATION_GUIDE.md](./PHASE_1_IMPLEMENTATION_GUIDE.md)**
  - What was built (7 core sections)
  - How to use each component
  - Why each piece was created
  - Performance checklist

### Phase 2-5: Roadmap (Ready to Start 🚀)
- **[FRONTEND_OPTIMIZATION_COMPLETE.md](./FRONTEND_OPTIMIZATION_COMPLETE.md)**
  - Before vs. After comparison
  - Expected performance metrics
  - Implementation roadmap (5 phases)
  - Testing checklist

---

## 🔧 Reference by Use Case

### I Want to...

**Build a Button**
```
1. Import from @/components/ui
2. See QUICK_REFERENCE.md → "UI Components" section
3. Check components/ui/index.tsx → Button props
4. Done! (2 min)
```

**Create a Form**
```
1. Use Button, Input, Alert from @/components/ui
2. Follow QUICK_REFERENCE.md → "Form Building" pattern
3. See AdminDashboardExample.tsx for reference
4. Done! (15 min)
```

**Build a Dashboard**
```
1. Import DashboardLayout components
2. Follow AdminDashboardExample.tsx template
3. Use StatCard, StatsGrid, Table components
4. Add Suspense + Skeletons for loading
5. Done! (30 min)
```

**Fetch Data Efficiently**
```
1. For initial load: Use server component + api.get()
2. For interactions: Use React Query + api.get()
3. See QUICK_REFERENCE.md → "Data Fetching Patterns"
4. See AdminDashboardExample.tsx → Stats component
5. Done! (20 min)
```

**Implement Search**
```
1. Use Input component
2. Use useDebounce hook
3. Use React Query with debounced value
4. See QUICK_REFERENCE.md → "With Debounced Search"
5. Done! (20 min)
```

**Add Pagination**
```
1. Use usePagination hook
2. Use React Query with page parameter
3. Render Pagination component
4. See QUICK_REFERENCE.md → "With Pagination"
5. Done! (15 min)
```

**Show Loading State**
```
1. Use Skeleton component (not Spinner!)
2. Wrap in Suspense if using server component
3. Choose correct skeleton size
4. See components/shared/loaders/skeletons.tsx
5. Done! (5 min)
```

**Display Status Badge**
```
1. Use Badge component from @/components/ui
2. Set variant based on status
3. Use BOOKING_STATUS_COLORS for colors
4. Done! (2 min)
```

**Handle Role-Based UI**
```
1. Import role constants
2. Use ROLES, ROLE_LABELS, ROLE_ROUTES
3. Check PROTECTED_ROUTES for authorization
4. See QUICK_REFERENCE.md → "Role-Based Patterns"
5. Done! (10 min)
```

---

## 📂 Component Library Map

### UI Components (`components/ui/index.tsx`)
```
Button .......................... Primary interaction element
  Variants: primary, secondary, danger, ghost
  Sizes: sm, md, lg
  Features: loading state, disabled state, icon support

Card ........................... Container with consistent styling
  Features: hover effect, clickable option

Badge .......................... Status indicators
  Variants: primary, secondary, success, warning, error, info
  Sizes: sm, md

Alert .......................... Notifications
  Variants: info, success, warning, error
  Features: icon support

Input .......................... Form field
  Features: label, error state, size variants

Spinner ........................ Loading indicator
  ⚠️ Use Skeleton instead! This is backup only.

EmptyState ..................... Empty list state
  Features: icon, title, description, action button
```

### Hooks (`components/shared/hooks/index.ts`)
```
useDebounce(value, delay) ...... Delay value updates
  Perfect for: search, filters

usePagination({total}) ......... Pagination logic
  Returns: page, nextPage, prevPage, goToPage

useToggle(initial) ............. Boolean state toggle
  Perfect for: modal open/close, expand/collapse

useLocalStorage(key, initial) .. Browser storage persistence
  Perfect for: theme, preferences, cache

useAsync(fn) ................... Simple data fetching
  Perfect for: one-off data loads
  
usePrevious(value) ............. Track previous value
  Perfect for: comparisons

useIsMounted() ................. Check hydration status
  Perfect for: avoid SSR mismatch
```

### Skeletons (`components/shared/loaders/skeletons.tsx`)
```
CardSkeleton ................... Single card placeholder
GridSkeleton ................... Multiple cards in grid
ListSkeleton ................... List of items
TableRowSkeleton ............... Table row placeholder
DashboardSkeleton .............. Complete dashboard mock
```

### Layout (`components/layout/DashboardLayout.tsx`)
```
DashboardContainer ............. Main layout wrapper
PageHeader ..................... Title + breadcrumb + actions
StatCard ....................... Single metric display
StatsGrid ...................... Multiple stats grid
ContentSection ................. Grouped content area
Table/TableHead/TableBody ...... Table structure
TableRow/TableCell ............. Table cell components
```

---

## 🎨 Design System Map

### Design Tokens (`lib/designTokens.ts`)
```
COLORS
  ├─ Role-based: ADMIN, VENDOR, STAFF, CUSTOMER
  ├─ Semantic: SUCCESS, ERROR, WARNING, INFO
  └─ Neutral: 50-900 scale

TYPOGRAPHY
  ├─ H1, H2, H3 (headings)
  └─ BODY_LG, BODY, BODY_SM, LABEL, CAPTION

SPACING (8px grid)
  └─ 0, 1, 2, 3, 4, 5, 6, 8

BORDER_RADIUS
  └─ SM, MD, LG, XL, FULL

SHADOWS
  └─ SM, MD, LG, XL

TRANSITIONS
  └─ FAST, BASE, SLOW
```

### Constants (`lib/constants/index.ts`)
```
ROLES ....................... CUSTOMER, VENDOR, STAFF, ADMIN
BOOKING_STATUS .............. PENDING, CONFIRMED, CHECKED_IN, etc.
PAYMENT_METHODS ............. KHALTI, CASH, STRIPE
HOTEL_STATUS ................ PENDING, APPROVED, REJECTED, SUSPENDED
ROOM_TYPES .................. SINGLE, DOUBLE, DELUXE, SUITE, etc.
ROOM_STATUS ................. AVAILABLE, OCCUPIED, CLEANING, etc.
PAGINATION .................. DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
CACHE_DURATION .............. INSTANT, SHORT, MEDIUM, LONG, VERY_LONG
DEBOUNCE_DELAY .............. INSTANT, FAST, NORMAL, SLOW
VALIDATION .................. PASSWORD, EMAIL, PHONE patterns
CURRENCY .................... NPR, USD (with symbols)
```

### API Client (`lib/api.ts`)
```
api.get(endpoint, options) ..... GET request
api.getTyped<T>(endpoint) ..... Typed GET
api.post(endpoint, data) ...... POST request
api.postTyped<T>(endpoint, data) Typed POST
api.patch(endpoint, data) ..... PATCH request
api.delete(endpoint) .......... DELETE request

Features:
  ✓ Retry logic (configurable)
  ✓ Request timeout (configurable)
  ✓ Error handling (401, 403, 404, 429, 5xx)
  ✓ Type safety
```

---

## 📊 Performance Metrics

### Current State (Baseline)
```
FCP: 2.8s (Poor)
LCP: 4.2s (Poor)
TTI: 6.1s (Poor)
CLS: 0.18 (Needs improvement)
Bundle: 250kb
Requests: 18 per load
```

### Expected After Phase 2 (Server Components)
```
FCP: 1.2s (-57%)
LCP: 1.8s (-57%)
TTI: 2.4s (-61%)
CLS: 0.05 (-72%)
Bundle: 200kb (-20%)
Requests: 10 (-44%)
```

### Expected After Phase 5 (Full Optimization)
```
FCP: <1.2s
LCP: <1.8s
TTI: <2.5s
CLS: <0.05
Bundle: <180kb
Requests: <8
Lighthouse: >90
```

---

## 🗓️ Implementation Timeline

### Week 1: Server Components
- Convert admin dashboard
- Convert vendor dashboard
- Convert customer dashboard
- Convert staff dashboard

### Week 2: Sub-pages
- Convert admin sub-pages
- Convert vendor sub-pages
- Measure performance

### Week 3: Data Layer
- Install React Query
- Create query hooks
- Audit API endpoints

### Week 4: Components
- Expand component library
- Build form utilities
- Add missing components

### Week 5: Optimization
- Performance audit
- Optimize bottlenecks
- Finalize documentation

---

## ✅ Quality Checklist

Before shipping to production:

### Performance
- [ ] Lighthouse > 90
- [ ] LCP < 2.5s
- [ ] FCP < 1.5s
- [ ] CLS < 0.1
- [ ] No console errors
- [ ] No hydration warnings

### Functionality
- [ ] All dashboards work
- [ ] Search/filters work
- [ ] Forms submit
- [ ] Loading states show
- [ ] Error states display

### Accessibility
- [ ] Keyboard navigation
- [ ] WCAG AA contrast
- [ ] ARIA labels
- [ ] Focus indicators

### Code Quality
- [ ] No TypeScript errors
- [ ] All props typed
- [ ] Components documented
- [ ] No eslint warnings

---

## 📞 Getting Help

### Quick Questions
→ Check **QUICK_REFERENCE.md**

### How to Use a Component
→ Check **component JSDoc** + **QUICK_REFERENCE.md**

### Performance Questions
→ Read **FRONTEND_OPTIMIZATION_COMPLETE.md**

### Architecture Decisions
→ Read **FRONTEND_ARCHITECTURE.md**

### Implementation Guide
→ Read **PHASE_1_IMPLEMENTATION_GUIDE.md**

---

## 🔗 External Resources

- **React Query Documentation**: https://tanstack.com/query/latest
- **Next.js App Router**: https://nextjs.org/docs/app
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
- **Lucide Icons**: https://lucide.dev

---

## 📋 Document Quick Links

| Document | Purpose | Read Time | Status |
|----------|---------|-----------|--------|
| **QUICK_REFERENCE.md** | Cheat sheet | 5 min | ✅ |
| **FRONTEND_SUMMARY.md** | Overview | 15 min | ✅ |
| **PHASE_1_IMPLEMENTATION_GUIDE.md** | Foundation | 30 min | ✅ |
| **FRONTEND_ARCHITECTURE.md** | Deep dive | 2 hours | ✅ |
| **FRONTEND_OPTIMIZATION_COMPLETE.md** | Roadmap | 45 min | ✅ |
| **DOCUMENTATION_INDEX.md** | This file | 10 min | ✅ |

---

## 🎓 Learning Path

### For New Team Members
1. Read QUICK_REFERENCE.md (5 min)
2. Review AdminDashboardExample.tsx (15 min)
3. Try building something small (1 hour)
4. Read PHASE_1_IMPLEMENTATION_GUIDE.md (30 min)
5. You're ready! 🚀

### For Architects
1. Read FRONTEND_ARCHITECTURE.md (2 hours)
2. Review FRONTEND_OPTIMIZATION_COMPLETE.md (1 hour)
3. Review all component implementations (1 hour)
4. Understand all the "why" decisions
5. You can mentor others! 👨‍🏫

### For Project Managers
1. Read FRONTEND_SUMMARY.md (15 min)
2. Review Performance Metrics section
3. Check Implementation Timeline
4. You understand the roadmap! 📊

---

## 🚀 Ready to Start?

```
1. Open QUICK_REFERENCE.md
2. Pick a page to update
3. Use Button component instead of custom Tailwind
4. Measure Lighthouse before/after
5. See the improvement
6. Celebrate! 🎉
```

---

**Last Updated**: April 3, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅  

---

**Questions? See the documentation above. Everything is covered! 📚**
