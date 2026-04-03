import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Call this once in your app entry point (e.g., app/layout.tsx)
 */
export function initializeSentry() {
  Sentry.init({
    // Your Sentry DSN (get from https://sentry.io/)
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment
    environment: process.env.NODE_ENV,

    // Set sample rate for performance monitoring (10% of transactions)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture replay for 100% of errors
    replaysOnErrorSampleRate: 1.0,

    // Capture replay for 10% of transactions
    replaysSessionSampleRate: 0.1,

    // Integrations for additional functionality
    // Note: Replay integration is automatically included in @sentry/nextjs

    // Ignore specific errors
    ignoreErrors: [
      // Ignore cancelled requests
      'NetworkError',
      'AbortError',
      // Ignore ResizeObserver errors (known browser bug)
      'ResizeObserver loop limit exceeded',
    ],
  });
}

/**
 * Capture an exception with Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'error') {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}
