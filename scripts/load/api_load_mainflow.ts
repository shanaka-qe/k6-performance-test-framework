/**
 * Load Test Script - Main User Flow
 * Purpose: Validate system performance under expected load
 * Duration: Medium (5-30 minutes)
 * Load: Realistic (constant arrival rate based on production traffic)
 * Use: Baseline performance validation, SLA verification
 */

import { Options } from 'k6/options';
import { SharedArray } from 'k6/data';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkApiSuccess, checkJsonFields } from '../../lib/checks';
import { getLoadScenario, getCommonThresholds, commonTags } from '../scenarios/common';
import { executeLogin } from '../scenarios/login';
import { executeCheckout } from '../scenarios/checkout';
import { recordSearch } from '../../lib/metrics';
import { getCustomThresholds } from '../../lib/metrics';
import { thinkTime, selectRandom, now, duration } from '../../lib/utils';

// Load environment configuration
const config = loadConfig(getEnvironment());

// Load test data (shared across all VUs to save memory)
const testUsers = new SharedArray('users', function () {
  // In production, load from CSV file
  // For now, generate sample users
  return [
    { username: 'user1@example.com', password: 'password123' },
    { username: 'user2@example.com', password: 'password123' },
    { username: 'user3@example.com', password: 'password123' },
    { username: 'user4@example.com', password: 'password123' },
    { username: 'user5@example.com', password: 'password123' },
  ];
});

// Sample product IDs for testing
const productIds = new SharedArray('products', function () {
  return [
    'prod-001',
    'prod-002',
    'prod-003',
    'prod-004',
    'prod-005',
    'prod-006',
    'prod-007',
    'prod-008',
  ];
});

// Test options configuration
export const options: Options = {
  // Use load test scenario with constant arrival rate
  scenarios: {
    main_user_flow: getLoadScenario(config.load.rps, config.load.duration),
  },

  // Define thresholds (quality gates) - test will fail if these are breached
  thresholds: {
    ...getCommonThresholds(),
    ...getCustomThresholds(),
  },

  // Apply tags to all metrics
  tags: {
    ...commonTags,
    test_type: 'load',
    environment: config.environment,
  },
};

// Setup function: Runs once before test starts
export function setup() {
  console.log('=== Load Test Starting ===');
  console.log(`Environment: ${config.environment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Target RPS: ${config.load.rps}`);
  console.log(`Duration: ${config.load.duration}`);
  console.log('==========================');

  return { config };
}

// Main test function: Represents a complete user journey
export default function (_data: Record<string, unknown>) {
  // Create HTTP client for this VU
  const httpClient = new HttpClient(config);

  // Select a random user from test data
  const user = selectRandom(testUsers);

  // ========================================================================
  // STEP 1: User Login
  // ========================================================================
  const token = executeLogin(httpClient, config, user.username, user.password);

  if (!token) {
    console.error('Login failed, aborting iteration');
    return; // Exit this iteration if login fails
  }

  // Think time: user navigates after login
  thinkTime(2, 0.3);

  // ========================================================================
  // STEP 2: Browse Products
  // ========================================================================
  // const browseStartTime = now(); // Unused for now

  const productsResponse = httpClient.get(config.endpoints.products, {
    tags: {
      endpoint: 'products_browse',
      flow: 'main_flow',
    },
  });

  checkApiSuccess(productsResponse, 1000);

  // Think time: user browses products
  thinkTime(3, 0.5);

  // ========================================================================
  // STEP 3: Search for Products
  // ========================================================================
  const searchStartTime = now();
  const searchQuery = 'laptop';

  const searchResponse = httpClient.get(`${config.endpoints.search}?q=${searchQuery}&limit=20`, {
    tags: {
      endpoint: 'search',
      flow: 'main_flow',
    },
  });

  const searchSuccess = checkApiSuccess(searchResponse, 800);
  recordSearch(searchSuccess, duration(searchStartTime));

  // Think time: user reviews search results
  thinkTime(4, 0.5);

  // ========================================================================
  // STEP 4: View Product Details
  // ========================================================================
  const productId = selectRandom(productIds);

  const productDetailResponse = httpClient.get(`${config.endpoints.products}/${productId}`, {
    tags: {
      endpoint: 'product_detail',
      flow: 'main_flow',
    },
  });

  checkApiSuccess(productDetailResponse, 800);
  checkJsonFields(productDetailResponse, ['id', 'name', 'price']);

  // Think time: user reads product details
  thinkTime(5, 0.5);

  // ========================================================================
  // STEP 5: Add to Cart and Checkout (30% of users)
  // ========================================================================
  // Simulate realistic conversion rate - not all users complete checkout
  const shouldCheckout = Math.random() < 0.3; // 30% conversion rate

  if (shouldCheckout) {
    // Select 1-3 random products for cart
    const numItems = Math.floor(Math.random() * 3) + 1;
    const cartItems: string[] = [];

    for (let i = 0; i < numItems; i++) {
      cartItems.push(selectRandom(productIds));
    }

    // Execute checkout flow
    const orderId = executeCheckout(httpClient, config, cartItems);

    if (orderId) {
      // Success! Log order ID in debug mode
      if (config.features?.debugMode) {
        console.log(`Order completed: ${orderId}`);
      }
    }
  }

  // Think time: user may continue browsing or leave
  thinkTime(2, 0.3);

  // ========================================================================
  // STEP 6: View User Profile (occasionally)
  // ========================================================================
  if (Math.random() < 0.5) {
    // 50% of users check their profile
    const profileResponse = httpClient.get(`${config.endpoints.users}/profile`, {
      tags: {
        endpoint: 'user_profile',
        flow: 'main_flow',
      },
    });

    checkApiSuccess(profileResponse, 600);
  }

  // Log iteration completion in debug mode
  if (config.features?.debugMode && __ITER % 10 === 0) {
    console.log(`VU ${__VU} completed iteration ${__ITER}`);
  }
}

// Teardown function: Runs once after all VUs complete
export function teardown(_data: Record<string, unknown>) {
  console.log('=== Load Test Complete ===');
  console.log('Check results and metrics in output');
}
