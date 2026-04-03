# Quick Reference Guide - Frontend Architecture

**Print this or bookmark it!** One-page cheat sheet for common tasks.

---

## Component Usage Quick Reference

### UI Components
```tsx
import { Button, Card, Badge, Alert, Input, Spinner, EmptyState } from '@/components/ui';

// Button
<Button variant="primary" | "secondary" | "danger" | "ghost" size="sm" | "md" | "lg" isLoading>
  Click me
</Button>

// Card
<Card hoverable>Content</Card>

// Badge
<Badge variant="success" | "error" | "warning" size="sm" | "md">Status</Badge>

// Alert
<Alert variant="info" | "success" | "warning" | "error" icon={<Icon />}>Message</Alert>

// Input
<Input label="Name" error="Required" size="sm" | "md" | "lg" />

// Spinner
<Spinner size="sm" | "md" | "lg" label="Loading..." />

// EmptyState
<EmptyState title="No data" action={{ label: 'Add', onClick: () => {} }} />
```

### Skeleton Loaders
```tsx
import { CardSkeleton, TableRowSkeleton, DashboardSkeleton, ListSkeleton, GridSkeleton } from '@/components/shared/loaders/skeletons';

<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

### Custom Hooks
```tsx
import { useDebounce, usePagination, useToggle, useLocalStorage, useAsync, usePrevious, useIsMounted } from '@/components/shared/hooks';

const debouncedValue = useDebounce(value, 300);
const { page, nextPage, prevPage } = usePagination({ total: 100 });
const [open, toggle] = useToggle(false);
const [stored, setStored] = useLocalStorage('key', 'default');
const { data, loading, error } = useAsync(() => fetch(...), true);
const prevValue = usePrevious(value);
const mounted = useIsMounted();
```

### Dashboard Layouts
```tsx
import {
  DashboardContainer, PageHeader, StatCard, StatsGrid, ContentSection,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell
} from '@/components/layout/DashboardLayout';

<DashboardContainer title="Title" subtitle="Sub" actions={<Button />} breadcrumbs={[...]}>
  <StatsGrid columns={4}>
    <StatCard label="L" value={123} icon={<Icon />} trend={5} color="amber" />
  </StatsGrid>
  <ContentSection title="Section">
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Column</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </ContentSection>
</DashboardContainer>
```

---

## Data Fetching Patterns

### Server Component (Fast, Secure)
```tsx
// app/page.tsx
async function getData() {
  const data = await api.get('/api/data', {
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  return data;
}

export default async function Page() {
  const data = await getData();
  return <div>{data}</div>;
}
```

### Client Component with React Query
```tsx
"use client";
import { useQuery } from '@tanstack/react-query';

export function Component() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get('/api/items'),
  });
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  return <List items={data} />;
}
```

### With Pagination
```tsx
const { page, pageSize } = usePagination({ total: 500 });

const { data } = useQuery({
  queryKey: ['items', page],
  queryFn: () => api.get(`/api/items?page=${page}&limit=${pageSize}`),
});
```

### With Debounced Search
```tsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

const { data } = useQuery({
  queryKey: ['items', debouncedSearch],
  queryFn: () => api.get(`/api/items?q=${debouncedSearch}`),
});
```

---

## Constants Usage

```tsx
import { 
  ROLES, BOOKING_STATUS, PAYMENT_METHODS, HOTEL_STATUS,
  PAGINATION, CACHE_DURATION, DEBOUNCE_DELAY
} from '@/lib/constants';

// Type-safe enums
const role: typeof ROLES[keyof typeof ROLES] = 'ADMIN';

// Labels
<span>{BOOKING_STATUS_LABELS[booking.status]}</span>

// Colors
<Badge variant={BOOKING_STATUS_COLORS[booking.status]} />

// Config
const pageSize = PAGINATION.DEFAULT_PAGE_SIZE; // 20
const cacheTime = CACHE_DURATION.MEDIUM; // 5 min
const debounceMs = DEBOUNCE_DELAY.NORMAL; // 300ms
```

---

## Design Tokens

```tsx
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/lib/designTokens';

// For reference only - use Tailwind classes in JSX
<div className={clsx(
  TYPOGRAPHY.H1,  // "text-3xl font-bold tracking-tight text-slate-900"
  'text-amber-600' // Use color from COLORS.ADMIN
)}>
  Heading
</div>
```

---

## API Client

```tsx
import { api } from '@/lib/api';

// GET
const data = await api.get('/endpoint');
const typed = await api.getTyped<Type>('/endpoint');

// POST
const result = await api.post('/endpoint', { data });
const resultTyped = await api.postTyped<Type>('/endpoint', { data });

// PATCH
await api.patch('/endpoint', { updates });

// DELETE
await api.delete('/endpoint');

// With options
await api.get('/endpoint', { 
  timeout: 5000, 
  retries: 2 
});
```

---

## Role-Based Patterns

```tsx
import { ROLES, ROLE_LABELS, ROLE_ROUTES, PROTECTED_ROUTES } from '@/lib/constants';

// Get user role
const role = session?.user?.role as typeof ROLES[keyof typeof ROLES];

// Redirect to role dashboard
redirect(ROLE_ROUTES[role]); // '/admin', '/vendor', etc.

// Check protected route
if (!PROTECTED_ROUTES[role].some(r => pathname.startsWith(r))) {
  redirect('/unauthorized');
}

// Display role badge
<Badge>{ROLE_LABELS[role]}</Badge> // "Administrator"
```

---

## Rendering Patterns

### Pattern 1: Full Server Component
```tsx
// No "use client" needed
export default async function Page() {
  const data = await fetch('/api/data');
  return <Content data={data} />;
}
```

### Pattern 2: Server + Client (Suspense)
```tsx
// Server component for data fetching
async function Stats() {
  const data = await api.get('/api/stats');
  return <Display data={data} />;
}

// Main page (server)
export default async function Dashboard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Stats />
    </Suspense>
  );
}
```

### Pattern 3: Pure Client Component
```tsx
"use client";

export function Interactive() {
  const { data } = useQuery({...});
  return <List data={data} />;
}
```

---

## Performance Checklist

```
Before implementing:
□ Lighthouse audit (get baseline)
□ Check bundle size
□ Profile with React DevTools

During implementation:
□ Use server components for data
□ Add skeleton loaders
□ Use React Query for client data
□ Implement pagination (not infinite scroll)
□ Debounce search/filters

After implementation:
□ Run Lighthouse again
□ Compare metrics
□ Check Core Web Vitals
□ Test on slow 3G (DevTools)
```

---

## File Organization

```
components/
├── ui/
│   └── index.tsx           # All UI components
├── shared/
│   ├── hooks/
│   │   └── index.ts        # All custom hooks
│   └── loaders/
│       └── skeletons.tsx   # All skeleton components
└── layout/
    └── DashboardLayout.tsx # Dashboard utilities

lib/
├── api.ts                  # API client
├── designTokens.ts         # Design system
└── constants/
    └── index.ts            # All constants
```

---

## Common Mistakes to Avoid

❌ **Don't**
```tsx
// Client component for just displaying data
"use client";
export function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(...); // ❌ Slow!
  }, []);
}

// Inline styling (use components)
<button className="bg-amber-600 px-4 py-2">...</button> // ❌ Inconsistent!

// Prop drilling (data through many components)
<Parent data={data}>
  <Child data={data}>
    <Display data={data} /> {/* ❌ Hard to maintain! */}
  </Child>
</Parent>

// Mixing UI libraries (inconsistent styling)
<Button>Native</Button> {/* from @/components/ui */}
<Button>Material</Button> {/* from @mui */} ❌
```

✅ **Do**
```tsx
// Server component for data fetching
export default async function Page() {
  const data = await api.get('/api/data'); // ✅ Fast!
  return <Display data={data} />;
}

// Use component library
<Button variant="primary">Click</Button> // ✅ Consistent!

// Pass data directly to component that needs it
<Display data={data} /> // ✅ Clear dependency!

// Stick to one UI library
<Button variant="primary" />
<Button variant="secondary" /> // ✅ Consistent!
```

---

## Debugging Tips

```tsx
// Check React Query cache
import { useQueryClient } from '@tanstack/react-query';
const client = useQueryClient();
console.log(client.getQueryData(['items'])); // See cached data

// Profile component renders
import { Profiler } from 'react';
<Profiler id="MyComponent" onRender={console.log}>
  <MyComponent />
</Profiler>

// Check hydration mismatch
const mounted = useIsMounted();
if (!mounted) return null; // Prevent SSR/CSR mismatch

// Log state changes
const { data } = useQuery({...}, {
  onSuccess: (data) => console.log('✅ Fetched:', data),
  onError: (error) => console.error('❌ Failed:', error),
});
```

---

## Useful Next.js Commands

```bash
# Development
npm run dev

# Check for build errors
npm run build

# Analyze bundle size
npm run build
# Check output in .next/static/

# Type check
npx tsc --noEmit

# Format code
npm run lint

# Database
npm run db:push     # Push schema changes
npm run db:migrate  # Create migration
npm run db:seed     # Seed data
npm run db:studio   # Visual editor
```

---

## Resources

- **Architecture**: `FRONTEND_ARCHITECTURE.md`
- **Implementation**: `PHASE_1_IMPLEMENTATION_GUIDE.md`
- **Examples**: `components/layout/AdminDashboardExample.tsx`
- **Components**: See JSDoc comments in component files
- **React Query**: https://tanstack.com/query/latest
- **Next.js**: https://nextjs.org/docs

---

**Pro Tip**: Bookmark this page! Use it as a reference while developing. 🚀
