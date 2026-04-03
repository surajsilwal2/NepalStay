/**
 * Role-based Constants
 * Single source of truth for role definitions and permissions
 */

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Customer',
  VENDOR: 'Vendor',
  STAFF: 'Staff Member',
  ADMIN: 'Administrator',
};

// Role-specific route prefixes
export const ROLE_ROUTES: Record<Role, string> = {
  CUSTOMER: '/customer',
  VENDOR: '/vendor',
  STAFF: '/staff',
  ADMIN: '/admin',
};

// Protected routes by role
export const PROTECTED_ROUTES: Record<Role, string[]> = {
  CUSTOMER: ['/customer', '/payment', '/itinerary'],
  VENDOR: ['/vendor'],
  STAFF: ['/staff'],
  ADMIN: ['/admin'],
};

/**
 * Booking-related Constants
 */
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  CHECKED_OUT: 'secondary',
  CANCELLED: 'error',
  NO_SHOW: 'error',
};

/**
 * Payment-related Constants
 */
export const PAYMENT_METHODS = {
  KHALTI: 'KHALTI',
  CASH: 'CASH',
  STRIPE: 'STRIPE',
} as const;

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

/**
 * Hotel-related Constants
 */
export const HOTEL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const HOTEL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SUSPENDED: 'error',
};

export const ROOM_TYPES = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  TWIN: 'TWIN',
  DELUXE: 'DELUXE',
  SUITE: 'SUITE',
  PENTHOUSE: 'PENTHOUSE',
  DORMITORY: 'DORMITORY',
} as const;

export const ROOM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export const ROOM_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  CLEANING: 'warning',
  MAINTENANCE: 'error',
};

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SIZES: [10, 20, 50, 100] as const,
};

/**
 * Time Constants (for caching, debouncing, etc)
 */
export const CACHE_DURATION = {
  INSTANT: 0,
  SHORT: 1000 * 60,        // 1 minute
  MEDIUM: 1000 * 60 * 5,   // 5 minutes
  LONG: 1000 * 60 * 30,    // 30 minutes
  VERY_LONG: 1000 * 60 * 60, // 1 hour
} as const;

export const DEBOUNCE_DELAY = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[0-9+\-\s()]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
} as const;

/**
 * Currency Constants
 */
export const CURRENCY = {
  NPR: 'NPR',
  USD: 'USD',
  DEFAULT: 'NPR',
} as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NPR: '₨',
  USD: '$',
};
