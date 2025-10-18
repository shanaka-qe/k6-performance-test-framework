/**
 * Custom Metrics Module
 * Defines custom k6 metrics for tracking domain-specific KPIs
 * All metrics are exported to Prometheus/InfluxDB/Grafana
 */

import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

// ============================================================================
// COUNTER METRICS - Track total count of events
// ============================================================================

/**
 * Count of successful login attempts
 */
export const loginSuccessCounter = new Counter('login_success_total');

/**
 * Count of failed login attempts
 */
export const loginFailureCounter = new Counter('login_failure_total');

/**
 * Count of successful checkout operations
 */
export const checkoutSuccessCounter = new Counter('checkout_success_total');

/**
 * Count of failed checkout operations
 */
export const checkoutFailureCounter = new Counter('checkout_failure_total');

/**
 * Count of products added to cart
 */
export const cartAddCounter = new Counter('cart_add_total');

/**
 * Count of search operations performed
 */
export const searchCounter = new Counter('search_total');

/**
 * Count of API errors by type
 */
export const apiErrorCounter = new Counter('api_error_total');

// ============================================================================
// TREND METRICS - Track distribution of values (min, max, avg, percentiles)
// ============================================================================

/**
 * Track login operation duration
 */
export const loginDuration = new Trend('login_duration', true);

/**
 * Track checkout operation duration
 */
export const checkoutDuration = new Trend('checkout_duration', true);

/**
 * Track search operation duration
 */
export const searchDuration = new Trend('search_duration', true);

/**
 * Track product listing page load time
 */
export const productListDuration = new Trend('product_list_duration', true);

/**
 * Track cart operations duration
 */
export const cartOperationDuration = new Trend('cart_operation_duration', true);

/**
 * Track time to first byte for API calls
 */
export const timeToFirstByte = new Trend('time_to_first_byte', true);

/**
 * Track database query times (if exposed by API)
 */
export const dbQueryDuration = new Trend('db_query_duration', true);

// ============================================================================
// RATE METRICS - Track ratio of boolean values (success/failure rates)
// ============================================================================

/**
 * Login success rate (true = success, false = failure)
 */
export const loginSuccessRate = new Rate('login_success_rate');

/**
 * Checkout success rate
 */
export const checkoutSuccessRate = new Rate('checkout_success_rate');

/**
 * Search success rate
 */
export const searchSuccessRate = new Rate('search_success_rate');

/**
 * Cart operations success rate
 */
export const cartSuccessRate = new Rate('cart_success_rate');

/**
 * API authentication success rate
 */
export const authSuccessRate = new Rate('auth_success_rate');

/**
 * Data validation success rate
 */
export const dataValidationRate = new Rate('data_validation_rate');

// ============================================================================
// GAUGE METRICS - Track current value that can go up or down
// ============================================================================

/**
 * Current number of items in cart (sampled)
 */
export const cartItemsGauge = new Gauge('cart_items_current');

/**
 * Current session duration
 */
export const sessionDurationGauge = new Gauge('session_duration_current');

/**
 * Active user sessions
 */
export const activeSessionsGauge = new Gauge('active_sessions');

// ============================================================================
// HELPER FUNCTIONS - Simplify metric recording
// ============================================================================

/**
 * Record a successful operation with duration
 * @param successCounter - Counter for successful operations
 * @param failureCounter - Counter for failed operations
 * @param successRate - Rate metric for success rate
 * @param durationTrend - Trend metric for operation duration
 * @param isSuccess - Whether operation succeeded
 * @param duration - Operation duration in milliseconds
 */
export function recordOperation(
  successCounter: Counter,
  failureCounter: Counter,
  successRate: Rate,
  durationTrend: Trend,
  isSuccess: boolean,
  duration: number
): void {
  // Record success/failure count
  if (isSuccess) {
    successCounter.add(1);
  } else {
    failureCounter.add(1);
  }

  // Record success rate (true/false)
  successRate.add(isSuccess);

  // Record duration
  durationTrend.add(duration);
}

/**
 * Record login operation result
 * @param isSuccess - Whether login succeeded
 * @param duration - Login duration in milliseconds
 */
export function recordLogin(isSuccess: boolean, duration: number): void {
  recordOperation(
    loginSuccessCounter,
    loginFailureCounter,
    loginSuccessRate,
    loginDuration,
    isSuccess,
    duration
  );
}

/**
 * Record checkout operation result
 * @param isSuccess - Whether checkout succeeded
 * @param duration - Checkout duration in milliseconds
 */
export function recordCheckout(isSuccess: boolean, duration: number): void {
  recordOperation(
    checkoutSuccessCounter,
    checkoutFailureCounter,
    checkoutSuccessRate,
    checkoutDuration,
    isSuccess,
    duration
  );
}

/**
 * Record search operation result
 * @param isSuccess - Whether search succeeded
 * @param duration - Search duration in milliseconds
 */
export function recordSearch(isSuccess: boolean, duration: number): void {
  searchCounter.add(1);
  searchSuccessRate.add(isSuccess);
  searchDuration.add(duration);
}

/**
 * Record cart operation result
 * @param isSuccess - Whether cart operation succeeded
 * @param duration - Operation duration in milliseconds
 */
export function recordCartOperation(isSuccess: boolean, duration: number): void {
  cartAddCounter.add(1);
  cartSuccessRate.add(isSuccess);
  cartOperationDuration.add(duration);
}

/**
 * Record an API error with tags for categorization
 * @param errorType - Type of error (e.g., '400', '500', 'timeout')
 * @param endpoint - API endpoint where error occurred
 */
export function recordApiError(errorType: string, endpoint: string): void {
  // Increment error counter with tags
  apiErrorCounter.add(1, {
    error_type: errorType,
    endpoint: endpoint,
  });
}

/**
 * Update the current cart items count
 * @param itemCount - Current number of items in cart
 */
export function updateCartItems(itemCount: number): void {
  cartItemsGauge.add(itemCount);
}

/**
 * Update the current session duration
 * @param durationSeconds - Current session duration in seconds
 */
export function updateSessionDuration(durationSeconds: number): void {
  sessionDurationGauge.add(durationSeconds);
}

// ============================================================================
// THRESHOLD DEFINITIONS - Export for use in test scripts
// ============================================================================

/**
 * Get standard thresholds for custom metrics
 * Can be spread into test options.thresholds
 */
export function getCustomThresholds() {
  return {
    // Login metrics
    login_success_rate: ['rate>0.95'], // 95% of logins should succeed
    login_duration: ['p(95)<2000', 'p(99)<3000'], // p95 < 2s, p99 < 3s

    // Checkout metrics
    checkout_success_rate: ['rate>0.98'], // 98% of checkouts should succeed
    checkout_duration: ['p(95)<3000', 'p(99)<5000'], // p95 < 3s, p99 < 5s

    // Search metrics
    search_success_rate: ['rate>0.99'], // 99% of searches should succeed
    search_duration: ['p(95)<500', 'p(99)<1000'], // p95 < 500ms, p99 < 1s

    // Cart metrics
    cart_success_rate: ['rate>0.99'],
    cart_operation_duration: ['p(95)<800'],

    // Auth metrics
    auth_success_rate: ['rate>0.95'],

    // Data validation
    data_validation_rate: ['rate>0.95'],

    // Overall check success
    check_success_rate: ['rate>0.95'],
  };
}

/**
 * Get strict thresholds for production-like environments
 */
export function getStrictThresholds() {
  return {
    login_success_rate: ['rate>0.98'],
    login_duration: ['p(95)<1500', 'p(99)<2500'],
    checkout_success_rate: ['rate>0.99'],
    checkout_duration: ['p(95)<2000', 'p(99)<4000'],
    search_success_rate: ['rate>0.995'],
    search_duration: ['p(95)<400', 'p(99)<800'],
    cart_success_rate: ['rate>0.995'],
    cart_operation_duration: ['p(95)<600'],
    auth_success_rate: ['rate>0.98'],
    data_validation_rate: ['rate>0.98'],
    check_success_rate: ['rate>0.98'],
  };
}
