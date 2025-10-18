/**
 * HTTP Client Module
 * Provides a wrapped k6 HTTP client with defaults, retries, and error handling
 * Centralizes HTTP configuration for consistency across all tests
 */

import http, { RefinedResponse, ResponseType } from 'k6/http';
import { sleep } from 'k6';
import { Config } from './env';

// Interface for HTTP request parameters
export interface RequestParams {
  headers?: { [key: string]: string };
  timeout?: string;
  tags?: { [key: string]: string };
  cookies?: { [key: string]: string };
  redirects?: number;
  auth?: string | { username: string; password: string };
}

// Interface for retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * HTTP Client class that wraps k6/http with additional functionality
 * Provides consistent defaults, automatic retries, and centralized error handling
 */
export class HttpClient {
  private config: Config;
  private defaultHeaders: { [key: string]: string };
  private retryConfig: RetryConfig;

  /**
   * Create a new HttpClient instance
   * @param config - Application configuration object
   */
  constructor(config: Config) {
    // Store the configuration for use in requests
    this.config = config;

    // Set up default headers that will be included in all requests
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': config.http.userAgent,
      Accept: 'application/json',
    };

    // Configure retry behavior from config
    this.retryConfig = config.retry;
  }

  /**
   * Merge default parameters with request-specific parameters
   * @param params - Request-specific parameters
   * @returns Merged parameters object
   */
  private mergeParams(params?: RequestParams): RequestParams {
    return {
      // Set timeout from config if not specified
      timeout: params?.timeout || this.config.http.timeout,
      // Merge default headers with request-specific headers
      headers: { ...this.defaultHeaders, ...(params?.headers || {}) },
      // Set max redirects from config if not specified
      redirects: params?.redirects !== undefined ? params.redirects : this.config.http.maxRedirects,
      // Include tags for better metrics filtering in Grafana
      tags: {
        environment: this.config.environment,
        ...(params?.tags || {}),
      },
      // Include any cookies if specified
      cookies: params?.cookies,
      // Include basic auth if specified
      auth: params?.auth,
    };
  }

  /**
   * Calculate exponential backoff delay for retries
   * @param attempt - Current retry attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    // Calculate exponential delay: initialDelay * (multiplier ^ attempt)
    const delay =
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    // Cap the delay at maxDelay to prevent excessive waiting
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Determine if a request should be retried based on response and method
   * @param response - HTTP response object
   * @param method - HTTP method used
   * @returns True if request should be retried
   */
  private shouldRetry(response: RefinedResponse<ResponseType>, method: string): boolean {
    // Only retry idempotent methods (GET, PUT, DELETE, HEAD, OPTIONS)
    // Never retry POST as it may cause duplicate operations
    const idempotentMethods = ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!idempotentMethods.includes(method.toUpperCase())) {
      return false;
    }

    // Retry on server errors (5xx) or specific client errors
    if (response.status >= 500) {
      return true;
    }

    // Retry on specific transient errors
    if (response.status === 429 || response.status === 408) {
      // 429 = Too Many Requests, 408 = Request Timeout
      return true;
    }

    // Don't retry on other status codes
    return false;
  }

  /**
   * Execute an HTTP request with retry logic
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param url - Full URL or path (will be prefixed with baseUrl if relative)
   * @param body - Request body (optional)
   * @param params - Request parameters (optional)
   * @returns HTTP response object
   */
  private executeWithRetry(
    method: string,
    url: string,
    body?: string | object,
    params?: RequestParams
  ): RefinedResponse<ResponseType> {
    // Build the full URL (add baseUrl if url is relative)
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;

    // Merge default and custom parameters
    const mergedParams = this.mergeParams(params);

    // Add method tag for better metrics filtering
    mergedParams.tags!.method = method.toUpperCase();

    let response: RefinedResponse<ResponseType>;
    let attempt = 0;

    // Retry loop
    while (attempt <= this.retryConfig.maxRetries) {
      // Execute the HTTP request based on method
      switch (method.toUpperCase()) {
        case 'GET':
          response = http.get(fullUrl, mergedParams);
          break;
        case 'POST':
          response = http.post(fullUrl, body ? JSON.stringify(body) : '', mergedParams);
          break;
        case 'PUT':
          response = http.put(fullUrl, body ? JSON.stringify(body) : '', mergedParams);
          break;
        case 'PATCH':
          response = http.patch(fullUrl, body ? JSON.stringify(body) : '', mergedParams);
          break;
        case 'DELETE':
          response = http.del(fullUrl, body ? JSON.stringify(body) : '', mergedParams);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Check if request succeeded or if we should stop retrying
      if (response.status < 400 || !this.shouldRetry(response, method)) {
        // Request succeeded or should not be retried
        return response;
      }

      // Check if we have more retries available
      if (attempt < this.retryConfig.maxRetries) {
        // Calculate backoff delay for this attempt
        const delayMs = this.calculateBackoff(attempt);

        // Log retry attempt if debug mode is enabled
        if (this.config.features?.debugMode) {
          console.log(
            `Retrying ${method} ${fullUrl} after ${delayMs}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
          );
        }

        // Wait before retrying (convert ms to seconds for k6 sleep)
        sleep(delayMs / 1000);
      }

      // Increment attempt counter
      attempt++;
    }

    // All retries exhausted, return the last response
    return response!;
  }

  /**
   * Perform a GET request
   * @param url - URL or path
   * @param params - Request parameters (optional)
   * @returns HTTP response
   */
  public get(url: string, params?: RequestParams): RefinedResponse<ResponseType> {
    return this.executeWithRetry('GET', url, undefined, params);
  }

  /**
   * Perform a POST request
   * @param url - URL or path
   * @param body - Request body
   * @param params - Request parameters (optional)
   * @returns HTTP response
   */
  public post(
    url: string,
    body: string | object,
    params?: RequestParams
  ): RefinedResponse<ResponseType> {
    return this.executeWithRetry('POST', url, body, params);
  }

  /**
   * Perform a PUT request
   * @param url - URL or path
   * @param body - Request body
   * @param params - Request parameters (optional)
   * @returns HTTP response
   */
  public put(
    url: string,
    body: string | object,
    params?: RequestParams
  ): RefinedResponse<ResponseType> {
    return this.executeWithRetry('PUT', url, body, params);
  }

  /**
   * Perform a PATCH request
   * @param url - URL or path
   * @param body - Request body
   * @param params - Request parameters (optional)
   * @returns HTTP response
   */
  public patch(
    url: string,
    body: string | object,
    params?: RequestParams
  ): RefinedResponse<ResponseType> {
    return this.executeWithRetry('PATCH', url, body, params);
  }

  /**
   * Perform a DELETE request
   * @param url - URL or path
   * @param params - Request parameters (optional)
   * @returns HTTP response
   */
  public delete(url: string, params?: RequestParams): RefinedResponse<ResponseType> {
    return this.executeWithRetry('DELETE', url, undefined, params);
  }

  /**
   * Set or update the authorization header for all subsequent requests
   * @param token - Bearer token or other auth value
   * @param type - Auth type (default: 'Bearer')
   */
  public setAuthToken(token: string, type: string = 'Bearer'): void {
    this.defaultHeaders['Authorization'] = `${type} ${token}`;
  }

  /**
   * Remove the authorization header
   */
  public clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Add or update a default header
   * @param key - Header name
   * @param value - Header value
   */
  public setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Get the base URL from configuration
   * @returns Base URL string
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
  }
}
