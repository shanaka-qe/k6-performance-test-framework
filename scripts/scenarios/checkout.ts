/**
 * Checkout Scenario
 * Reusable checkout flow for e-commerce operations
 */

import { HttpClient } from '../../lib/httpClient';
import { Config } from '../../lib/env';
import { checkApiSuccess, checkJsonFields } from '../../lib/checks';
import { recordCheckout, cartAddCounter } from '../../lib/metrics';
import { now, duration, generateUuid, thinkTime } from '../../lib/utils';

/**
 * Add item to cart
 * @param httpClient - HTTP client instance
 * @param config - Configuration object
 * @param productId - ID of product to add
 * @param quantity - Quantity to add
 * @returns True if successful
 */
export function addToCart(
  httpClient: HttpClient,
  config: Config,
  productId: string,
  quantity: number = 1
): boolean {
  // Prepare add to cart request
  const cartPayload = {
    productId: productId,
    quantity: quantity,
  };

  // Send request to cart endpoint
  const response = httpClient.post(`${config.endpoints.orders}/cart`, cartPayload, {
    tags: {
      endpoint: 'cart_add',
      flow: 'checkout',
    },
  });

  // Validate response
  const success = checkApiSuccess(response, 1000); // Max 1 second for cart add

  // Record cart operation
  if (success) {
    cartAddCounter.add(1);
  }

  return success;
}

/**
 * Execute complete checkout flow
 * @param httpClient - HTTP client instance
 * @param config - Configuration object
 * @param cartItems - Array of product IDs to purchase
 * @returns Order ID if successful, null otherwise
 */
export function executeCheckout(
  httpClient: HttpClient,
  config: Config,
  cartItems: string[]
): string | null {
  // Record start time
  const startTime = now();

  // Step 1: Add items to cart
  for (const productId of cartItems) {
    const added = addToCart(httpClient, config, productId);
    if (!added) {
      console.error(`Failed to add product ${productId} to cart`);
      recordCheckout(false, duration(startTime));
      return null;
    }
    // Think time: user considers next item
    thinkTime(1, 0.3);
  }

  // Step 2: Review cart
  const cartResponse = httpClient.get(`${config.endpoints.orders}/cart`, {
    tags: {
      endpoint: 'cart_review',
      flow: 'checkout',
    },
  });

  if (!checkApiSuccess(cartResponse)) {
    console.error('Failed to review cart');
    recordCheckout(false, duration(startTime));
    return null;
  }

  // Think time: user reviews cart contents
  thinkTime(3, 0.5);

  // Step 3: Submit checkout
  const checkoutPayload = {
    orderId: generateUuid(),
    paymentMethod: 'credit_card',
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
    },
  };

  const checkoutResponse = httpClient.post(config.endpoints.orders, checkoutPayload, {
    tags: {
      endpoint: 'checkout_submit',
      flow: 'checkout',
    },
  });

  // Calculate total checkout duration
  const checkoutDuration = duration(startTime);

  // Validate checkout response
  const success = checkApiSuccess(checkoutResponse, 5000); // Max 5 seconds for checkout

  // Also check that we received an order ID
  const hasOrderId = checkJsonFields(checkoutResponse, ['orderId']);

  const overallSuccess = success && hasOrderId;

  // Record checkout metrics
  recordCheckout(overallSuccess, checkoutDuration);

  // Extract and return order ID if successful
  if (overallSuccess) {
    const responseBody = checkoutResponse.json() as Record<string, unknown>;
    return responseBody.orderId as string;
  }

  return null;
}
