/**
 * Skeleton Loaders - Matching component sizes for smooth loading experience
 * 
 * Usage:
 * - Replace components during loading state
 * - Prevents layout shift (CLS: 0)
 * - Visual indicator that content is coming
 */

import { clsx } from 'clsx';

// Pulse animation keyframes (add to globals.css if needed)
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-200">
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
      </td>
    </tr>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-slate-200 p-4"
          >
            <div className="h-10 bg-slate-100 rounded-lg mb-3"></div>
            <div className="h-6 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ columns = 3, count = 6 }: { columns?: number; count?: number }) {
  return (
    <div className={clsx('grid gap-4', {
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
      'grid-cols-1 md:grid-cols-2': columns === 2,
      'grid-cols-1': columns === 1,
    })}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
