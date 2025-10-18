/**
 * Login Scenario
 * Reusable login flow for user authentication
 */

import { HttpClient } from '../../lib/httpClient';
import { Config } from '../../lib/env';
import { checkApiSuccess } from '../../lib/checks';
import { recordLogin } from '../../lib/metrics';
import { now, duration } from '../../lib/utils';

/**
 * Execute login flow
 * @param httpClient - HTTP client instance
 * @param config - Configuration object
 * @param username - Username for login
 * @param password - Password for login
 * @returns Login token or null if failed
 */
export function executeLogin(
  httpClient: HttpClient,
  config: Config,
  username: string,
  password: string
): string | null {
  // Record start time for performance tracking
  const startTime = now();

  // Prepare login request payload
  const loginPayload = {
    username: username,
    password: password,
  };

  // Send login request to authentication endpoint
  const response = httpClient.post(config.endpoints.login, loginPayload, {
    tags: {
      endpoint: 'login',
      flow: 'authentication',
    },
  });

  // Calculate operation duration
  const loginDuration = duration(startTime);

  // Validate response
  const success = checkApiSuccess(response, 3000); // Max 3 seconds for login

  // Record metrics for login operation
  recordLogin(success, loginDuration);

  // Extract and return token if login succeeded
  if (success && response.status === 200) {
    const responseBody = response.json() as Record<string, unknown>;
    const token = responseBody.token || responseBody.access_token;

    if (token && typeof token === 'string') {
      // Store token in HTTP client for subsequent requests
      httpClient.setAuthToken(token);
      return token;
    }
  }

  // Login failed
  console.error(`Login failed for user ${username}: Status ${response.status}`);
  return null;
}
