/**
 * Design Tokens - Single Source of Truth
 * Used across all components for consistency
 * 
 * Follows 8px grid system and role-based color coding
 */

export const COLORS = {
  // Role-based colors (for badges, highlights, accents)
  ADMIN: '#f59e0b',      // Amber (oversight, control)
  VENDOR: '#a855f7',     // Purple (management)
  STAFF: '#3b82f6',      // Blue (operations)
  CUSTOMER: '#10b981',   // Green (buyer)

  // Semantic colors
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',

  // Neutral palette (Slate)
  NEUTRAL: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const TYPOGRAPHY = {
  // Page titles
  H1: 'text-3xl font-bold tracking-tight text-slate-900',
  H2: 'text-2xl font-semibold text-slate-900',
  H3: 'text-xl font-semibold text-slate-800',
  
  // Body text
  BODY_LG: 'text-lg text-slate-700',
  BODY: 'text-base text-slate-700',
  BODY_SM: 'text-sm text-slate-600',
  
  // UI elements
  LABEL: 'text-sm font-medium text-slate-700',
  CAPTION: 'text-xs text-slate-500',
};

export const SPACING = {
  // 8px grid system
  0: '0',
  1: '0.5rem',   // 8px
  2: '1rem',     // 16px
  3: '1.5rem',   // 24px
  4: '2rem',     // 32px
  5: '2.5rem',   // 40px
  6: '3rem',     // 48px
  8: '4rem',     // 64px
};

export const BORDER_RADIUS = {
  SM: '0.375rem',  // 6px
  MD: '0.5rem',    // 8px
  LG: '1rem',      // 16px
  XL: '1.5rem',    // 24px
  FULL: '9999px',
};

export const SHADOWS = {
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const TRANSITIONS = {
  FAST: 'transition-all duration-150',
  BASE: 'transition-all duration-200',
  SLOW: 'transition-all duration-300',
};

// Role-based styling helpers
export const ROLE_BADGE_STYLES = {
  CUSTOMER: 'bg-green-100 text-green-700 border border-green-200',
  VENDOR: 'bg-purple-100 text-purple-700 border border-purple-200',
  STAFF: 'bg-blue-100 text-blue-700 border border-blue-200',
  ADMIN: 'bg-amber-100 text-amber-700 border border-amber-200',
} as const;

export const ROLE_COLORS = {
  CUSTOMER: 'text-green-700',
  VENDOR: 'text-purple-700',
  STAFF: 'text-blue-700',
  ADMIN: 'text-amber-700',
} as const;
