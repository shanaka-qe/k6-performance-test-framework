/**
 * Soak Test Script (Endurance Test)
 * Purpose: Detect memory leaks, performance degradation over time
 * Duration: Long (2-8 hours)
 * Load: Sustained moderate load
 * Use: Pre-production validation, stability verification
 */

import { Options } from 'k6/options';
import { SharedArray } from 'k6/data';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkApiSuccess } from '../../lib/checks';
import { getSoakScenario, getCommonThresholds, commonTags } from '../scenarios/common';
import { executeLogin } from '../scenarios/login';
import { executeCheckout } from '../scenarios/checkout';
import { thinkTime, selectRandom } from '../../lib/utils';

// Load environment configuration
const config = loadConfig(getEnvironment());

// Test data
const testUsers = new SharedArray('users', function () {
  return [
    { username: 'soak1@example.com', password: 'password123' },
    { username: 'soak2@example.com', password: 'password123' },
    { username: 'soak3@example.com', password: 'password123' },
    { username: 'soak4@example.com', password: 'password123' },
    { username: 'soak5@example.com', password: 'password123' },
  ];
});

const productIds = new SharedArray('products', function () {
  return ['prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005'];
});

// Test options configuration
export const options: Options = {
  // Use soak test scenario (constant load over extended period)
  scenarios: {
    soak_test: getSoakScenario(30, '2h'), // 30 RPS for 2 hours (adjust for your needs)
  },

  // Standard thresholds - should maintain performance throughout test
  thresholds: {
    ...getCommonThresholds(),
    // Key metrics to watch for degradation over time
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'],
    // Ensure checks remain stable
    checks: ['rate>0.95'],
  },

  // Apply tags
  tags: {
    ...commonTags,
    test_type: 'soak',
    environment: config.environment,
  },
};

// Track test progress
let iterationCount = 0;
const startTime = Date.now();

// Setup function
export function setup() {
  console.log('=== Soak Test Starting ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Duration: 2 hours at 30 RPS`);
  console.log('Monitor for:');
  console.log('- Memory leaks');
  console.log('- Performance degradation');
  console.log('- Connection pool exhaustion');
  console.log('- Database connection leaks');
  console.log('==========================');

  return { config, startTime: Date.now() };
}

// Main test function: Realistic user flow
export default function (_data: Record<string, unknown>) {
  const httpClient = new HttpClient(config);

  // Track iteration
  iterationCount++;

  // Periodic progress reporting (every 15 minutes worth of iterations)
  const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
  if (iterationCount % 100 === 0) {
    console.log(
      `Soak test progress: ${elapsedMinutes.toFixed(1)} minutes elapsed, ${iterationCount} iterations completed by VU ${__VU}`
    );
  }

  // Select random user
  const user = selectRandom(testUsers);

  // ========================================================================
  // Complete user journey (similar to load test)
  // ========================================================================

  // Step 1: Login
  const token = executeLogin(httpClient, config, user.username, user.password);

  if (!token) {
    console.error('Login failed in soak test');
    return;
  }

  thinkTime(2, 0.3);

  // Step 2: Browse products
  const productsResponse = httpClient.get(config.endpoints.products, {
    tags: {
      endpoint: 'products_browse',
      flow: 'soak',
    },
  });

  checkApiSuccess(productsResponse);
  thinkTime(3, 0.4);

  // Step 3: Search
  const searchQuery = selectRandom(['laptop', 'phone', 'tablet', 'monitor']);
  const searchResponse = httpClient.get(`${config.endpoints.search}?q=${searchQuery}`, {
    tags: {
      endpoint: 'search',
      flow: 'soak',
    },
  });

  checkApiSuccess(searchResponse);
  thinkTime(3, 0.5);

  // Step 4: View product details
  const productId = selectRandom(productIds);
  const productResponse = httpClient.get(`${config.endpoints.products}/${productId}`, {
    tags: {
      endpoint: 'product_detail',
      flow: 'soak',
    },
  });

  checkApiSuccess(productResponse);
  thinkTime(4, 0.5);

  // Step 5: Occasional checkout (20% conversion)
  if (Math.random() < 0.2) {
    const cartItems = [selectRandom(productIds), selectRandom(productIds)];
    const orderId = executeCheckout(httpClient, config, cartItems);

    if (orderId && config.features?.debugMode) {
      console.log(`Soak test order: ${orderId}`);
    }
  }

  thinkTime(2, 0.3);

  // Step 6: Check user profile occasionally
  if (Math.random() < 0.3) {
    const profileResponse = httpClient.get(`${config.endpoints.users}/profile`, {
      tags: {
        endpoint: 'user_profile',
        flow: 'soak',
      },
    });

    checkApiSuccess(profileResponse);
  }

  // Watch for performance degradation
  if (productsResponse.timings.duration > 2000) {
    console.warn(
      `DEGRADATION WARNING: Products endpoint took ${productsResponse.timings.duration}ms at ${elapsedMinutes.toFixed(1)} minutes into test`
    );
  }
}

// Teardown function
export function teardown(_data: Record<string, unknown>) {
  const totalMinutes = (Date.now() - (_data as any).startTime) / 1000 / 60;

  console.log('=== Soak Test Complete ===');
  console.log(`Total duration: ${totalMinutes.toFixed(1)} minutes`);
  console.log('Analysis checklist:');
  console.log('1. Compare early vs late test metrics');
  console.log('2. Review memory usage trends');
  console.log('3. Check database connection counts');
  console.log('4. Verify no response time degradation');
  console.log('5. Confirm error rate remained stable');
}
