/**
 * Checks and Assertions Module
 * Provides standardized check functions for response validation
 * Helps maintain consistency across all test scripts
 */

import { check, Response } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric to track overall check success rate
export const checkSuccessRate = new Rate('check_success_rate');

/**
 * Standard check for successful HTTP response (2xx status codes)
 * @param response - HTTP response object
 * @param checkName - Optional custom name for the check
 * @returns True if check passed
 */
export function checkStatusOk(response: Response, checkName: string = 'status is 2xx'): boolean {
  const result = check(response, {
    [checkName]: (r) => r.status >= 200 && r.status < 300,
  });

  // Record the check result in our custom metric
  checkSuccessRate.add(result);

  return result;
}

/**
 * Check for a specific HTTP status code
 * @param response - HTTP response object
 * @param expectedStatus - Expected status code
 * @param checkName - Optional custom name for the check
 * @returns True if check passed
 */
export function checkStatus(response: Response, expectedStatus: number, checkName?: string): boolean {
  const name = checkName || `status is ${expectedStatus}`;

  const result = check(response, {
    [name]: (r) => r.status === expectedStatus,
  });

  checkSuccessRate.add(result);
  return result;
}

/**
 * Check that response body contains expected JSON fields
 * @param response - HTTP response object
 * @param fields - Array of field paths to check (e.g., ['data.id', 'data.name'])
 * @returns True if all checks passed
 */
export function checkJsonFields(response: Response, fields: string[]): boolean {
  // Build checks object dynamically for each field
  const checks: { [key: string]: (r: Response) => boolean } = {};

  fields.forEach((field) => {
    checks[`has field: ${field}`] = (r) => {
      try {
        const value = r.json(field);
        return value !== undefined && value !== null;
      } catch (e) {
        return false;
      }
    };
  });

  const result = check(response, checks);
  checkSuccessRate.add(result);

  return result;
}

/**
 * Check that response body matches expected JSON structure
 * @param response - HTTP response object
 * @param expectedValues - Object with field paths as keys and expected values
 * @returns True if all checks passed
 */
export function checkJsonValues(response: Response, expectedValues: { [key: string]: any }): boolean {
  const checks: { [key: string]: (r: Response) => boolean } = {};

  Object.keys(expectedValues).forEach((field) => {
    const expectedValue = expectedValues[field];
    checks[`${field} equals ${expectedValue}`] = (r) => {
      try {
        const actualValue = r.json(field);
        return actualValue === expectedValue;
      } catch (e) {
        return false;
      }
    };
  });

  const result = check(response, checks);
  checkSuccessRate.add(result);

  return result;
}

/**
 * Check response time is within acceptable threshold
 * @param response - HTTP response object
 * @param maxDuration - Maximum acceptable duration in milliseconds
 * @param checkName - Optional custom name for the check
 * @returns True if check passed
 */
export function checkResponseTime(response: Response, maxDuration: number, checkName?: string): boolean {
  const name = checkName || `response time < ${maxDuration}ms`;

  const result = check(response, {
    [name]: (r) => r.timings.duration < maxDuration,
  });

  checkSuccessRate.add(result);
  return result;
}

/**
 * Check that response body contains specific text
 * @param response - HTTP response object
 * @param text - Text to search for in response body
 * @param checkName - Optional custom name for the check
 * @returns True if check passed
 */
export function checkBodyContains(response: Response, text: string, checkName?: string): boolean {
  const name = checkName || `body contains '${text}'`;

  const result = check(response, {
    [name]: (r) => r.body !== undefined && r.body.includes(text),
  });

  checkSuccessRate.add(result);
  return result;
}

/**
 * Check response content type
 * @param response - HTTP response object
 * @param expectedType - Expected content type (e.g., 'application/json')
 * @returns True if check passed
 */
export function checkContentType(response: Response, expectedType: string): boolean {
  const result = check(response, {
    [`content-type is ${expectedType}`]: (r) => {
      const contentType = r.headers['Content-Type'] || r.headers['content-type'];
      return contentType !== undefined && contentType.includes(expectedType);
    },
  });

  checkSuccessRate.add(result);
  return result;
}

/**
 * Comprehensive check for successful JSON API response
 * Combines status, content-type, and response time checks
 * @param response - HTTP response object
 * @param maxDuration - Maximum acceptable duration in milliseconds (optional)
 * @returns True if all checks passed
 */
export function checkApiSuccess(response: Response, maxDuration?: number): boolean {
  const checks: { [key: string]: (r: Response) => boolean } = {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'content-type is JSON': (r) => {
      const contentType = r.headers['Content-Type'] || r.headers['content-type'];
      return contentType !== undefined && contentType.includes('application/json');
    },
  };

  // Add response time check if maxDuration is specified
  if (maxDuration !== undefined) {
    checks[`response time < ${maxDuration}ms`] = (r) => r.timings.duration < maxDuration;
  }

  const result = check(response, checks);
  checkSuccessRate.add(result);

  return result;
}

/**
 * Check that response indicates an error with expected status
 * Useful for negative testing scenarios
 * @param response - HTTP response object
 * @param expectedStatus - Expected error status code (e.g., 400, 404, 500)
 * @param expectedError - Optional error message or code to check in response
 * @returns True if checks passed
 */
export function checkExpectedError(response: Response, expectedStatus: number, expectedError?: string): boolean {
  const checks: { [key: string]: (r: Response) => boolean } = {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  };

  // Check for specific error message if provided
  if (expectedError) {
    checks[`error contains '${expectedError}'`] = (r) => {
      return r.body !== undefined && r.body.includes(expectedError);
    };
  }

  const result = check(response, checks);
  checkSuccessRate.add(result);

  return result;
}

/**
 * Validate response against a JSON schema (simplified)
 * Checks that all required fields exist and have correct types
 * @param response - HTTP response object
 * @param schema - Schema definition with field names and expected types
 * @returns True if all checks passed
 */
export function checkJsonSchema(response: Response, schema: { [field: string]: string }): boolean {
  const checks: { [key: string]: (r: Response) => boolean } = {};

  Object.keys(schema).forEach((field) => {
    const expectedType = schema[field];
    checks[`${field} is ${expectedType}`] = (r) => {
      try {
        const value = r.json(field);
        if (value === undefined || value === null) {
          return false;
        }
        // Check type matches
        return typeof value === expectedType;
      } catch (e) {
        return false;
      }
    };
  });

  const result = check(response, checks);
  checkSuccessRate.add(result);

  return result;
}

/**
 * Execute custom checks with automatic success rate tracking
 * @param response - HTTP response object
 * @param checks - Check definitions
 * @returns True if all checks passed
 */
export function executeChecks(response: Response, checks: { [name: string]: (r: Response) => boolean }): boolean {
  const result = check(response, checks);
  checkSuccessRate.add(result);
  return result;
}

