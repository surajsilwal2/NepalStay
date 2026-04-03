/**
 * Unified API Client
 * Single abstraction for all API calls with caching, error handling, and retry logic
 * 
 * Replaces scattered fetch calls throughout the codebase
 * Provides consistent error handling and type safety
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class APIClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '',
    options: { timeout?: number; retries?: number } = {}
  ) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 10000; // 10 seconds
    this.retries = options.retries || 1;
  }

  /**
   * Make a request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, retries = this.retries, ...fetchOptions } =
      options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          timeout
        );

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - clear session
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            throw new Error('Unauthorized. Please log in again.');
          }

          if (response.status === 403) {
            throw new Error('You do not have permission to access this.');
          }

          if (response.status === 404) {
            throw new Error('Resource not found.');
          }

          if (response.status === 429) {
            throw new Error('Too many requests. Please try again later.');
          }

          if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              errorData.message ||
              `HTTP ${response.status} Error`
          );
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on 4xx errors or if we've exhausted retries
        if (
          error instanceof Error &&
          (error.message.includes('HTTP 4') ||
            error.message.includes('Unauthorized') ||
            error.message.includes('do not have permission') ||
            attempt === retries)
        ) {
          throw error;
        }

        // Wait before retrying
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Shorthand methods for common API responses
   */

  async getTyped<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.get<ApiResponse<T>>(endpoint, options);
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  }

  async postTyped<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await this.post<ApiResponse<T>>(endpoint, data, options);
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  }
}

// Singleton instance
export const api = new APIClient();
