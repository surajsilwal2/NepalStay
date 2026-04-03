/**
 * Dashboard Layout - Shared across all role-based dashboards
 * 
 * Provides:
 * - Consistent sidebar + content structure
 * - Breadcrumb navigation
 * - Responsive design
 * - Page-level loading/error states
 * 
 * Used by: Admin, Vendor, Staff, Customer dashboards
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode; // Right-aligned actions (buttons, filters)
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

/**
 * Page Header - Consistent title, subtitle, actions
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: Omit<DashboardLayoutProps, 'children'>) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <span className="text-slate-400">/</span>}
              {crumb.href && !crumb.current ? (
                <a href={crumb.href} className="hover:text-slate-900">
                  {crumb.label}
                </a>
              ) : (
                <span className={crumb.current ? 'font-semibold text-slate-900' : ''}>
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and actions row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Stat Card - Display key metrics
 */
export function StatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  color = 'amber',
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  icon?: ReactNode;
  color?: 'amber' | 'green' | 'blue' | 'purple' | 'red';
}) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
            {icon}
          </div>
        )}
        {trend !== undefined && (
          <div className={clsx('text-xs font-semibold', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600 mt-0.5">{label}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
  );
}

/**
 * Stats Grid - Display multiple stats
 */
export function StatsGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return <div className={clsx('grid gap-4', colsClass)}>{children}</div>;
}

/**
 * Content Section - Grouped content with optional border
 */
export function ContentSection({
  title,
  description,
  children,
  divider = true,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={clsx(divider && 'border-b border-slate-200 pb-8 mb-8')}>
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Table Components - Reusable table structure
 */
export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className={clsx('w-full', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  children,
  sticky = false,
}: {
  children: ReactNode;
  sticky?: boolean;
}) {
  return (
    <thead
      className={clsx(
        'bg-slate-50 border-b border-slate-200',
        sticky && 'sticky top-0'
      )}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  clickable = false,
}: {
  children: ReactNode;
  className?: string;
  clickable?: boolean;
}) {
  return (
    <tr
      className={clsx(
        'border-b border-slate-100 hover:bg-slate-50 transition-colors',
        clickable && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      className={clsx(
        'px-6 py-3 text-sm font-semibold text-slate-700',
        alignClass,
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td className={clsx('px-6 py-4 text-sm text-slate-700', alignClass, className)}>
      {children}
    </td>
  );
}

/**
 * Main Dashboard Layout Container
 */
export function DashboardContainer({
  title,
  subtitle,
  children,
  actions,
  breadcrumbs,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
        {children}
      </main>
    </div>
  );
}
