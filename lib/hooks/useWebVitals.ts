'use client';

import { useEffect } from 'react';

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook for sending Web Vitals metrics to backend
 * Call this once in your root layout
 *
 * Usage:
 * useWebVitals();
 */
export function useWebVitals() {
  useEffect(() => {
    // Check if we have Web Vitals API available
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const sendMetric = async (data: MetricData) => {
      try {
        await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            timestamp: Date.now(),
            metadata: {
              ...data.metadata,
              url: typeof window !== 'undefined' ? window.location.pathname : '',
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            },
          }),
          // Use sendBeacon if available for reliability
          keepalive: true,
        });
      } catch (error) {
        console.error('Failed to send metric:', error);
      }
    };

    // Track First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            sendMetric({
              name: 'FCP',
              value: Math.round(entry.startTime),
              unit: 'ms',
            });
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.error('FCP observer failed:', e);
    }

    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        sendMetric({
          name: 'LCP',
          value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
          unit: 'ms',
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Stop observing LCP after 5 seconds
      setTimeout(() => lcpObserver.disconnect(), 5000);
    } catch (e) {
      console.error('LCP observer failed:', e);
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput) continue;
          clsValue += (entry as any).value;
          sendMetric({
            name: 'CLS',
            value: Math.round(clsValue * 100) / 100,
          });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('CLS observer failed:', e);
    }

    // Track Time to Interactive (estimate with long tasks)
    try {
      const timeToInteractive = performance.timing?.domInteractive
        ? performance.timing.domInteractive - performance.timing.navigationStart
        : 0;

      if (timeToInteractive > 0) {
        sendMetric({
          name: 'TTI',
          value: Math.round(timeToInteractive),
          unit: 'ms',
        });
      }
    } catch (e) {
      console.error('TTI calculation failed:', e);
    }
  }, []);
}

/**
 * Send custom metric
 * Usage: const sendMetric = useSendMetric(); sendMetric('custom_event', 123);
 */
export function useSendMetric() {
  return async (name: string, value: number, unit?: string, metadata?: Record<string, any>) => {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          value,
          unit,
          metadata,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  };
}
