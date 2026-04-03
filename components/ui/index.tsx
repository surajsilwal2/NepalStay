/**
 * Core UI Components - Reusable, Atomic, Accessible
 * 
 * Philosophy:
 * - Single responsibility per component
 * - Minimal props (composable, not bloated)
 * - Fully typed (TypeScript)
 * - Accessibility built-in
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'font-medium rounded-lg transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'inline-flex items-center justify-center gap-2',
        fullWidth && 'w-full',

        // Variants
        variant === 'primary' &&
          'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
        variant === 'secondary' &&
          'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
        variant === 'danger' &&
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        variant === 'ghost' &&
          'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',

        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',

        className,
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  clickable?: boolean;
  hoverable?: boolean;
}

export function Card({
  children,
  className,
  clickable = false,
  hoverable = true,
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-slate-200',
        'shadow-sm',
        hoverable && 'hover:shadow-md transition-shadow duration-200',
        clickable && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        'whitespace-nowrap',

        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',

        // Variants
        variant === 'primary' && 'bg-amber-100 text-amber-700',
        variant === 'secondary' && 'bg-slate-100 text-slate-700',
        variant === 'success' && 'bg-green-100 text-green-700',
        variant === 'warning' && 'bg-yellow-100 text-yellow-700',
        variant === 'error' && 'bg-red-100 text-red-700',
        variant === 'info' && 'bg-blue-100 text-blue-700',
      )}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative">
        <Loader2 className={clsx(sizeClass, 'animate-spin text-amber-600')} />
      </div>
      {label && <p className="text-sm text-slate-600">{label}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
}

export function Alert({ children, variant = 'info', icon }: AlertProps) {
  const colorMap = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div
      className={clsx(
        'flex gap-3 p-4 rounded-lg border',
        colorMap[variant],
      )}
      role="alert"
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size'
  > {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  size = 'md',
  className,
  ...props
}: InputProps) {
  const sizeClass = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  }[size];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border border-slate-300',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'disabled:bg-slate-100 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          error && 'border-red-500 focus:ring-red-500',
          sizeClass,
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-slate-400 text-5xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm" variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
