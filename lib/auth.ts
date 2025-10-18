/**
 * Authentication Module
 * Handles OAuth token management, token refresh, and authentication flows
 * Supports correlation of dynamic values across requests
 */

import { HttpClient } from './httpClient';
import { Config } from './env';
import { check } from 'k6';

// Interface for OAuth token response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// Interface for authentication credentials
export interface Credentials {
  username?: string;
  password?: string;
  clientId: string;
  clientSecret?: string;
  grantType: string;
  scope?: string;
}

/**
 * Authentication Manager class
 * Handles token fetching, caching, and refresh logic
 */
export class AuthManager {
  private httpClient: HttpClient;
  private config: Config;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  /**
   * Create a new AuthManager instance
   * @param httpClient - HTTP client to use for auth requests
   * @param config - Application configuration
   */
  constructor(httpClient: HttpClient, config: Config) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * Fetch an OAuth access token using client credentials grant
   * @param credentials - Authentication credentials
   * @returns Token response object
   */
  public fetchToken(credentials: Credentials): TokenResponse | null {
    // Build the token request URL
    const tokenUrl = `${this.config.auth.authUrl}${this.config.auth.tokenEndpoint}`;

    // Prepare the request body based on grant type
    const requestBody: any = {
      grant_type: credentials.grantType,
      client_id: credentials.clientId,
    };

    // Add client secret if provided
    if (credentials.clientSecret) {
      requestBody.client_secret = credentials.clientSecret;
    }

    // Add username and password for password grant type
    if (credentials.username && credentials.password) {
      requestBody.username = credentials.username;
      requestBody.password = credentials.password;
    }

    // Add scope if provided
    if (credentials.scope) {
      requestBody.scope = credentials.scope;
    }

    // Make the token request with form-urlencoded content type
    const response = this.httpClient.post(tokenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      tags: {
        endpoint: 'auth_token',
        flow: 'authentication',
      },
    });

    // Check if token request was successful
    const success = check(response, {
      'token request successful': (r) => r.status === 200,
      'token response has access_token': (r) => r.json('access_token') !== undefined,
    });

    // If request failed, log error and return null
    if (!success) {
      console.error(`Token fetch failed: ${response.status} - ${response.body}`);
      return null;
    }

    // Parse the token response
    const tokenData = response.json() as TokenResponse;

    // Cache the token and expiration time
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token || null;

    // Calculate when the token will expire (current time + expires_in - refresh threshold)
    // Subtract refresh threshold to refresh before actual expiration
    const expiresInSeconds = tokenData.expires_in - this.config.auth.refreshThreshold;
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

    // Log token acquisition if debug mode is enabled
    if (this.config.features?.debugMode) {
      console.log(
        `Token acquired successfully, expires in ${tokenData.expires_in}s, will refresh at ${this.tokenExpiresAt}`
      );
    }

    return tokenData;
  }

  /**
   * Refresh an existing access token using a refresh token
   * @returns New token response or null if refresh fails
   */
  public refreshAccessToken(): TokenResponse | null {
    // Check if we have a refresh token
    if (!this.refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    // Use client credentials from config
    const credentials: Credentials = {
      clientId: this.config.auth.clientId,
      clientSecret: this.config.auth.clientSecret,
      grantType: 'refresh_token',
    };

    // Build the token request URL
    const tokenUrl = `${this.config.auth.authUrl}${this.config.auth.tokenEndpoint}`;

    // Prepare refresh token request body
    const requestBody = {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    };

    // Make the token refresh request
    const response = this.httpClient.post(tokenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      tags: {
        endpoint: 'auth_refresh',
        flow: 'authentication',
      },
    });

    // Check if refresh was successful
    const success = check(response, {
      'token refresh successful': (r) => r.status === 200,
    });

    if (!success) {
      console.error(`Token refresh failed: ${response.status}`);
      return null;
    }

    // Parse and cache the new token
    const tokenData = response.json() as TokenResponse;
    this.accessToken = tokenData.access_token;
    if (tokenData.refresh_token) {
      this.refreshToken = tokenData.refresh_token;
    }

    // Update expiration time
    const expiresInSeconds = tokenData.expires_in - this.config.auth.refreshThreshold;
    this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

    return tokenData;
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns Valid access token or null if unavailable
   */
  public getValidToken(): string | null {
    // Check if token is expired or about to expire
    if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
      // Token expired or about to expire, try to refresh
      if (this.config.features?.debugMode) {
        console.log('Token expired or expiring soon, refreshing...');
      }
      this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Set the access token in the HTTP client's authorization header
   */
  public setTokenInClient(): void {
    const token = this.getValidToken();
    if (token) {
      this.httpClient.setAuthToken(token);
    }
  }

  /**
   * Check if we have a valid access token
   * @returns True if token is available and not expired
   */
  public hasValidToken(): boolean {
    return this.accessToken !== null && (this.tokenExpiresAt === null || Date.now() < this.tokenExpiresAt);
  }

  /**
   * Clear all cached tokens
   */
  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.httpClient.clearAuthToken();
  }

  /**
   * Get the current access token (without validation)
   * @returns Current access token or null
   */
  public getCurrentToken(): string | null {
    return this.accessToken;
  }
}

/**
 * Extract a value from a response body using a JSON path
 * Useful for correlation (extracting dynamic IDs, tokens, etc.)
 * @param responseBody - Response body (string or object)
 * @param jsonPath - Dot-notation path to the value (e.g., 'data.user.id')
 * @returns Extracted value or null if not found
 */
export function extractValue(responseBody: any, jsonPath: string): any {
  // If response is a string, try to parse it as JSON
  let data = responseBody;
  if (typeof responseBody === 'string') {
    try {
      data = JSON.parse(responseBody);
    } catch (e) {
      console.error('Failed to parse response body as JSON');
      return null;
    }
  }

  // Navigate the JSON path
  const keys = jsonPath.split('.');
  let value = data;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }

  return value;
}

/**
 * Correlation helper: Store a value in VU-local storage
 * Each virtual user maintains its own correlation storage
 */
const correlationStore: Map<string, any> = new Map();

/**
 * Store a correlated value for later use in the VU's session
 * @param key - Correlation key
 * @param value - Value to store
 */
export function storeCorrelation(key: string, value: any): void {
  correlationStore.set(key, value);
}

/**
 * Retrieve a correlated value from VU's session
 * @param key - Correlation key
 * @returns Stored value or null if not found
 */
export function getCorrelation(key: string): any {
  return correlationStore.get(key) || null;
}

/**
 * Clear all correlation data for the current VU
 */
export function clearCorrelations(): void {
  correlationStore.clear();
}

