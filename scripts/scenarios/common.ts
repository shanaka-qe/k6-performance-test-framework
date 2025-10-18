/**
 * Common Scenario Configuration
 * Shared scenario definitions and executor configurations
 * Used across multiple test types
 */

import { Options } from 'k6/options';

/**
 * Common tags applied to all scenarios
 */
export const commonTags = {
  project: 'k6-performance-framework',
  team: 'qa-performance',
};

/**
 * Smoke test executor configuration
 * Minimal load to verify basic functionality
 */
export function getSmokeScenario(vus: number = 1, duration: string = '30s') {
  return {
    executor: 'constant-vus',
    vus: vus,
    duration: duration,
    gracefulStop: '5s',
  };
}

/**
 * Load test executor configuration
 * Constant arrival rate for baseline performance testing
 */
export function getLoadScenario(rate: number = 10, duration: string = '5m') {
  return {
    executor: 'constant-arrival-rate',
    rate: rate, // requests per second
    timeUnit: '1s',
    duration: duration,
    preAllocatedVUs: Math.ceil(rate / 2), // Initial VUs
    maxVUs: rate * 3, // Maximum VUs if needed
    gracefulStop: '10s',
  };
}

/**
 * Stress test executor configuration
 * Ramping arrival rate to find breaking points
 */
export function getStressScenario() {
  return {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 500,
    stages: [
      { target: 50, duration: '2m' }, // Ramp up to 50 rps
      { target: 100, duration: '3m' }, // Ramp up to 100 rps
      { target: 200, duration: '3m' }, // Ramp up to 200 rps
      { target: 300, duration: '2m' }, // Spike to 300 rps
      { target: 50, duration: '2m' }, // Ramp down to 50 rps
      { target: 0, duration: '1m' }, // Ramp down to 0
    ],
    gracefulStop: '30s',
  };
}

/**
 * Soak test executor configuration
 * Sustained load over extended period to detect memory leaks
 */
export function getSoakScenario(rate: number = 50, duration: string = '2h') {
  return {
    executor: 'constant-arrival-rate',
    rate: rate,
    timeUnit: '1s',
    duration: duration,
    preAllocatedVUs: Math.ceil(rate / 2),
    maxVUs: rate * 2,
    gracefulStop: '30s',
  };
}

/**
 * Spike test executor configuration
 * Sudden burst of traffic to test system resilience
 */
export function getSpikeScenario() {
  return {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 100,
    maxVUs: 1000,
    stages: [
      { target: 10, duration: '1m' }, // Normal load
      { target: 500, duration: '30s' }, // Sudden spike
      { target: 10, duration: '1m' }, // Return to normal
      { target: 1000, duration: '30s' }, // Massive spike
      { target: 10, duration: '1m' }, // Return to normal
    ],
    gracefulStop: '30s',
  };
}

/**
 * Get common thresholds for HTTP requests
 */
export function getCommonThresholds() {
  return {
    // Error rate should be less than 2%
    http_req_failed: ['rate<0.02'],
    // 95th percentile response time should be under 800ms
    'http_req_duration{expected_response:true}': ['p(95)<800'],
    // 99th percentile response time should be under 1500ms
    'http_req_duration{expected_response:true}': ['p(99)<1500'],
    // Check success rate should be above 95%
    checks: ['rate>0.95'],
  };
}

/**
 * Get strict thresholds for production-like testing
 */
export function getStrictThresholds() {
  return {
    // Error rate should be less than 1%
    http_req_failed: ['rate<0.01'],
    // 95th percentile response time should be under 500ms
    'http_req_duration{expected_response:true}': ['p(95)<500'],
    // 99th percentile response time should be under 1000ms
    'http_req_duration{expected_response:true}': ['p(99)<1000'],
    // Check success rate should be above 98%
    checks: ['rate>0.98'],
  };
}

