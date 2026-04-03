/**
 * Custom Hooks - Reusable logic for common patterns
 * 
 * Philosophy:
 * - Extract logic from components
 * - Make it testable and composable
 * - Full TypeScript support
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DEBOUNCE HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Debounce a value - useful for search inputs, filter changes
 * 
 * Usage:
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION HOOK
// ─────────────────────────────────────────────────────────────────────────────

interface UsePaginationProps {
  total: number;
  pageSize?: number;
  initialPage?: number;
}

export function usePagination({
  total,
  pageSize = 20,
  initialPage = 1,
}: UsePaginationProps) {
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.ceil(total / pageSize);
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  const goToPage = useCallback((p: number) => {
    const normalized = Math.max(1, Math.min(p, totalPages));
    setPage(normalized);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    page,
    pageSize,
    totalPages,
    isFirstPage,
    isLastPage,
    goToPage,
    nextPage,
    prevPage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sync state with localStorage
 * 
 * Usage:
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch {
        console.error('Failed to write to localStorage');
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC HOOK (Basic Data Fetching)
// ─────────────────────────────────────────────────────────────────────────────

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Simple async/await wrapper
 * For simple cases. Use React Query for complex scenarios.
 * 
 * Usage:
 * const { data, loading, error } = useAsync(() => fetch('/api/data'), []);
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncState<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIOUS VALUE HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track previous value (useful for comparisons)
 * 
 * Usage:
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOUNT STATUS HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if component is mounted (avoid hydration mismatch)
 * 
 * Usage:
 * const isMounted = useIsMounted();
 * if (!isMounted) return null;
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple boolean toggle
 * 
 * Usage:
 * const [isOpen, toggle] = useToggle(false);
 */
export function useToggle(
  initialState: boolean = false
): [boolean, () => void] {
  const [state, setState] = useState(initialState);
  const toggle = useCallback(() => setState((prev) => !prev), []);
  return [state, toggle];
}
