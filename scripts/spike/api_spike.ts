/**
 * Spike Test Script
 * Purpose: Test system resilience under sudden traffic bursts
 * Duration: Short (5-10 minutes with sharp peaks)
 * Load: Rapid increases and decreases
 * Use: Validate auto-scaling, circuit breakers, graceful degradation
 */

import { Options } from 'k6/options';
import { SharedArray } from 'k6/data';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkStatusOk } from '../../lib/checks';
import { getSpikeScenario, commonTags } from '../scenarios/common';
import { thinkTime, selectRandom } from '../../lib/utils';

// Load environment configuration
const config = loadConfig(getEnvironment());

// Test data
const testUsers = new SharedArray('users', function () {
  return [
    { username: 'spike1@example.com', password: 'password123' },
    { username: 'spike2@example.com', password: 'password123' },
    { username: 'spike3@example.com', password: 'password123' },
  ];
});

// Test options configuration
export const options: Options = {
  // Use spike test scenario with sudden traffic bursts
  scenarios: {
    spike_test: getSpikeScenario(),
  },

  // Relaxed thresholds - expect some failures during spike peaks
  thresholds: {
    // Allow higher error rate during spikes
    http_req_failed: ['rate<0.15'], // 15% error threshold acceptable
    // Relaxed response times during spikes
    'http_req_duration{expected_response:true}': ['p(95)<3000'],
    'http_req_duration{expected_response:true}': ['p(99)<8000'],
  },

  // Apply tags
  tags: {
    ...commonTags,
    test_type: 'spike',
    environment: config.environment,
  },

  // Disable aborting on threshold failures
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.15', abortOnFail: false }],
  },
};

// Setup function
export function setup() {
  console.log('=== Spike Test Starting ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('Will generate sudden traffic spikes');
  console.log('Watch for:');
  console.log('- Auto-scaling behavior');
  console.log('- Circuit breaker activation');
  console.log('- Rate limiting responses');
  console.log('- Recovery after spike');
  console.log('===========================');

  return { config };
}

// Main test function: Simplified high-speed operations
export default function (data: any) {
  const httpClient = new HttpClient(config);

  // Very minimal think time for spike testing
  // We want to generate as much load as possible

  // Step 1: Health check (lightweight endpoint)
  const healthResponse = httpClient.get(config.endpoints.health, {
    tags: {
      endpoint: 'health',
      flow: 'spike',
    },
  });

  checkStatusOk(healthResponse);

  // Almost no think time
  thinkTime(0.1, 0.05);

  // Step 2: Products list (heavier endpoint)
  const productsResponse = httpClient.get(`${config.endpoints.products}?limit=20`, {
    tags: {
      endpoint: 'products_list',
      flow: 'spike',
    },
  });

  // Check status but don't fail if service is degraded
  const productsOk = checkStatusOk(productsResponse);

  // Log rate limiting or service degradation
  if (productsResponse.status === 429) {
    console.log(`VU ${__VU}: Rate limited (429)`);
  } else if (productsResponse.status === 503) {
    console.log(`VU ${__VU}: Service unavailable (503)`);
  } else if (!productsOk) {
    console.log(`VU ${__VU}: Request failed with status ${productsResponse.status}`);
  }

  // Minimal think time
  thinkTime(0.1, 0.05);

  // Step 3: Search (resource-intensive)
  const searchQueries = ['laptop', 'phone', 'tablet'];
  const query = selectRandom(searchQueries);

  const searchResponse = httpClient.get(`${config.endpoints.search}?q=${query}`, {
    tags: {
      endpoint: 'search',
      flow: 'spike',
    },
  });

  checkStatusOk(searchResponse);

  // Track response times during spike
  if (searchResponse.timings.duration > 5000) {
    console.warn(`VU ${__VU}: Extreme latency - ${searchResponse.timings.duration}ms for search`);
  }

  // Log periodic status during spike
  if (__ITER % 50 === 0) {
    console.log(
      `VU ${__VU} iteration ${__ITER}: Health=${healthResponse.status}, Products=${productsResponse.status}, Search=${searchResponse.status}`
    );
  }
}

// Teardown function
export function teardown(data: any) {
  console.log('=== Spike Test Complete ===');
  console.log('Review metrics for:');
  console.log('1. Error rate during spike peaks');
  console.log('2. Recovery time after spikes');
  console.log('3. Auto-scaling responsiveness');
  console.log('4. Rate limiting effectiveness');
  console.log('5. Circuit breaker behavior');
  console.log('6. Maximum handled RPS');
}

