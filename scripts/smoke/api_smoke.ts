/**
 * Smoke Test Script
 * Purpose: Quick validation that the system is functional
 * Duration: Short (30 seconds - 2 minutes)
 * Load: Minimal (1-5 VUs)
 * Use: Pre-deployment checks, CI pipeline validation
 */

import { Options } from 'k6/options';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkStatusOk, checkJsonFields } from '../../lib/checks';
import { getSmokeScenario, getCommonThresholds, commonTags } from '../scenarios/common';
import { thinkTime } from '../../lib/utils';

// Load environment configuration
const config = loadConfig(getEnvironment());

// Test options configuration
export const options: Options = {
  // Use smoke test scenario (minimal load)
  scenarios: {
    smoke_test: getSmokeScenario(2, '1m'),
  },

  // Define thresholds (quality gates)
  thresholds: {
    ...getCommonThresholds(),
    // Smoke tests should have very high success rate
    http_req_failed: ['rate<0.01'],
  },

  // Apply common tags to all metrics
  tags: {
    ...commonTags,
    test_type: 'smoke',
    environment: config.environment,
  },
};

// Setup function: Runs once per VU before iterations
export function setup() {
  console.log('=== Smoke Test Starting ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('===========================');

  return { config };
}

// Main test function: Runs for each iteration
export default function (data: any) {
  // Create HTTP client with loaded configuration
  const httpClient = new HttpClient(config);

  // Test 1: Health check endpoint
  const healthResponse = httpClient.get(config.endpoints.health, {
    tags: {
      endpoint: 'health',
      test: 'smoke',
    },
  });

  // Validate health check response
  checkStatusOk(healthResponse, 'health check successful');

  // Short think time
  thinkTime(1, 0.2);

  // Test 2: Users endpoint (list)
  const usersResponse = httpClient.get(config.endpoints.users, {
    tags: {
      endpoint: 'users_list',
      test: 'smoke',
    },
  });

  // Validate users response
  checkStatusOk(usersResponse, 'users endpoint accessible');

  // Short think time
  thinkTime(1, 0.2);

  // Test 3: Products endpoint (list)
  const productsResponse = httpClient.get(config.endpoints.products, {
    tags: {
      endpoint: 'products_list',
      test: 'smoke',
    },
  });

  // Validate products response and check for expected fields
  checkStatusOk(productsResponse, 'products endpoint accessible');
  // Optionally check for expected data structure
  // checkJsonFields(productsResponse, ['data', 'total']);

  // Short think time
  thinkTime(1, 0.2);

  // Test 4: Search endpoint
  const searchResponse = httpClient.get(`${config.endpoints.search}?q=test`, {
    tags: {
      endpoint: 'search',
      test: 'smoke',
    },
  });

  // Validate search response
  checkStatusOk(searchResponse, 'search endpoint accessible');

  // Log iteration completion in debug mode
  if (config.features?.debugMode) {
    console.log(`VU ${__VU} completed iteration ${__ITER}`);
  }
}

// Teardown function: Runs once after all iterations complete
export function teardown(data: any) {
  console.log('=== Smoke Test Complete ===');
}

