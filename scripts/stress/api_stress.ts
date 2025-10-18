/**
 * Stress Test Script
 * Purpose: Find system breaking points and maximum capacity
 * Duration: Medium (10-20 minutes)
 * Load: Progressively increasing (ramping arrival rate)
 * Use: Capacity planning, identifying bottlenecks
 */

import { Options } from 'k6/options';
import { SharedArray } from 'k6/data';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkStatusOk } from '../../lib/checks';
import { getStressScenario, commonTags } from '../scenarios/common';
import { executeLogin } from '../scenarios/login';
import { thinkTime, selectRandom } from '../../lib/utils';

// Load environment configuration
const config = loadConfig(getEnvironment());

// Test data
const testUsers = new SharedArray('users', function () {
  return [
    { username: 'stress1@example.com', password: 'password123' },
    { username: 'stress2@example.com', password: 'password123' },
    { username: 'stress3@example.com', password: 'password123' },
    { username: 'stress4@example.com', password: 'password123' },
    { username: 'stress5@example.com', password: 'password123' },
  ];
});

// Test options configuration
export const options: Options = {
  // Use stress test scenario with ramping arrival rate
  scenarios: {
    stress_test: getStressScenario(),
  },

  // Relaxed thresholds for stress testing (we expect some failures at peak)
  thresholds: {
    // Allow higher error rate during stress peaks
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: false }], // 10% error threshold
    // Relaxed response time requirements
    'http_req_duration{expected_response:true}': ['p(95)<2000', 'p(99)<5000'],
  },

  // Apply tags
  tags: {
    ...commonTags,
    test_type: 'stress',
    environment: config.environment,
  },
};

// Setup function
export function setup() {
  console.log('=== Stress Test Starting ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('Will progressively increase load to find breaking point');
  console.log('============================');

  return { config };
}

// Main test function: Simplified flow focusing on high-throughput operations
export default function (_data: Record<string, unknown>) {
  const httpClient = new HttpClient(config);

  // Random user selection
  const user = selectRandom(testUsers);

  // Simplified flow for stress testing:
  // Focus on most critical and resource-intensive endpoints

  // Step 1: Authentication (cached to reduce auth load)
  // In real scenario, you might want to cache tokens per VU
  const token = executeLogin(httpClient, config, user.username, user.password);

  if (!token) {
    return; // Skip iteration if auth fails
  }

  // Minimal think time during stress test
  thinkTime(0.5, 0.1);

  // Step 2: High-volume read operations
  // Products list (database-intensive)
  const productsResponse = httpClient.get(`${config.endpoints.products}?limit=50`, {
    tags: {
      endpoint: 'products_list',
      flow: 'stress',
    },
  });

  checkStatusOk(productsResponse);

  // Minimal think time
  thinkTime(0.3, 0.1);

  // Step 3: Search (typically resource-intensive)
  const searchQueries = ['laptop', 'phone', 'tablet', 'monitor', 'keyboard'];
  const query = selectRandom(searchQueries);

  const searchResponse = httpClient.get(`${config.endpoints.search}?q=${query}`, {
    tags: {
      endpoint: 'search',
      flow: 'stress',
    },
  });

  checkStatusOk(searchResponse);

  // Minimal think time
  thinkTime(0.3, 0.1);

  // Step 4: Product details (database + cache testing)
  const productId = `prod-${Math.floor(Math.random() * 100)
    .toString()
    .padStart(3, '0')}`;

  const productResponse = httpClient.get(`${config.endpoints.products}/${productId}`, {
    tags: {
      endpoint: 'product_detail',
      flow: 'stress',
    },
  });

  checkStatusOk(productResponse);

  // Log performance degradation warnings
  if (productResponse.timings.duration > 3000) {
    console.warn(
      `High latency detected: ${productResponse.timings.duration}ms for ${productResponse.url}`
    );
  }

  // Periodic status logging
  if (__ITER % 100 === 0) {
    console.log(`VU ${__VU}: Completed ${__ITER} iterations - Status: ${productsResponse.status}`);
  }
}

// Teardown function
export function teardown(_data: Record<string, unknown>) {
  console.log('=== Stress Test Complete ===');
  console.log('Review metrics to identify:');
  console.log('1. Maximum sustainable RPS');
  console.log('2. Response time degradation patterns');
  console.log('3. Error rate at peak load');
  console.log('4. Resource utilization (CPU, memory, DB connections)');
}
