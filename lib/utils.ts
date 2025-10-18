/**
 * Utility Functions Module
 * Provides helper functions for common operations in performance tests
 * Includes data generation, randomization, timing, and formatting utilities
 */

import { sleep } from 'k6';
// Note: k6-jslib functions are implemented locally to avoid external dependencies

// ============================================================================
// DATA GENERATION UTILITIES
// ============================================================================

/**
 * Generate a random UUID v4
 * @returns UUID string
 */
export function generateUuid(): string {
  // Generate a simple UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a random email address
 * @param domain - Email domain (default: example.com)
 * @returns Email string
 */
export function generateEmail(domain: string = 'example.com'): string {
  const username = randomString(10).toLowerCase();
  return `${username}@${domain}`;
}

/**
 * Generate a random phone number (US format)
 * @returns Phone number string
 */
export function generatePhoneNumber(): string {
  const areaCode = randomIntBetween(200, 999);
  const prefix = randomIntBetween(200, 999);
  const lineNumber = randomIntBetween(1000, 9999);
  return `${areaCode}-${prefix}-${lineNumber}`;
}

/**
 * Generate a random alphanumeric string
 * @param length - Length of string to generate
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Alias for compatibility
export const randomString = generateRandomString;

/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Alias for compatibility
export const randomIntBetween = randomInt;

/**
 * Select a random item from an array
 * @param array - Array to select from
 * @returns Random item from array
 */
export function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random date between two dates
 * @param start - Start date
 * @param end - End date
 * @returns Random date
 */
export function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = randomInt(startTime, endTime);
  return new Date(randomTime);
}

/**
 * Generate a random boolean with optional probability
 * @param probability - Probability of true (0.0 to 1.0, default 0.5)
 * @returns Random boolean
 */
export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

// ============================================================================
// TIMING AND PACING UTILITIES
// ============================================================================

/**
 * Sleep for a random duration between min and max seconds
 * Useful for simulating realistic think time
 * @param minSeconds - Minimum sleep duration
 * @param maxSeconds - Maximum sleep duration
 */
export function randomSleep(minSeconds: number, maxSeconds: number): void {
  const duration = randomInt(minSeconds * 1000, maxSeconds * 1000) / 1000;
  sleep(duration);
}

/**
 * Think time: Sleep to simulate user reading or thinking
 * @param seconds - Base think time in seconds
 * @param variance - Variance as a percentage (0.0 to 1.0, default 0.2 = ±20%)
 */
export function thinkTime(seconds: number, variance: number = 0.2): void {
  const minSeconds = seconds * (1 - variance);
  const maxSeconds = seconds * (1 + variance);
  randomSleep(minSeconds, maxSeconds);
}

/**
 * Pacing: Ensure a minimum duration between iterations
 * Sleeps only if elapsed time is less than target pace
 * @param startTime - Start timestamp from Date.now()
 * @param targetPaceSeconds - Target pace duration in seconds
 */
export function pace(startTime: number, targetPaceSeconds: number): void {
  const elapsed = (Date.now() - startTime) / 1000;
  const remaining = targetPaceSeconds - elapsed;

  if (remaining > 0) {
    sleep(remaining);
  }
}

/**
 * Get current timestamp in milliseconds
 * @returns Current timestamp
 */
export function now(): number {
  return Date.now();
}

/**
 * Calculate duration between two timestamps
 * @param startTime - Start timestamp from Date.now()
 * @param endTime - End timestamp from Date.now() (optional, defaults to now)
 * @returns Duration in milliseconds
 */
export function duration(startTime: number, endTime?: number): number {
  return (endTime || Date.now()) - startTime;
}

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Format a timestamp as ISO 8601 date string
 * @param timestamp - Timestamp in milliseconds (optional, defaults to now)
 * @returns ISO date string
 */
export function formatIsoDate(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toISOString();
}

/**
 * Parse CSV line into array of values
 * @param line - CSV line string
 * @returns Array of values
 */
export function parseCsvLine(line: string): string[] {
  // Simple CSV parser (doesn't handle quoted commas)
  return line.split(',').map((value) => value.trim());
}

/**
 * Convert object to URL query string
 * @param params - Object with query parameters
 * @returns Query string (without leading ?)
 */
export function toQueryString(params: { [key: string]: string | number | boolean }): string {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// WEIGHTED SELECTION UTILITIES
// ============================================================================

/**
 * Interface for weighted items
 */
interface WeightedItem<T> {
  item: T;
  weight: number;
}

/**
 * Select a random item based on weights
 * Higher weight = higher probability of selection
 * @param items - Array of weighted items
 * @returns Selected item
 */
export function weightedRandom<T>(items: WeightedItem<T>[]): T {
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Select item based on weight
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.item;
    }
  }

  // Fallback to last item (shouldn't happen)
  return items[items.length - 1].item;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a string is a valid email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid UUID format
 * @param uuid - UUID string to validate
 * @returns True if valid UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a value is null or undefined
 * @param value - Value to check
 * @returns True if null or undefined
 */
export function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Shuffle an array randomly (Fisher-Yates algorithm)
 * @param array - Array to shuffle
 * @returns Shuffled array (new array, original unchanged)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Chunk an array into smaller arrays of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log a message with timestamp and VU info
 * @param message - Message to log
 * @param data - Additional data to log (optional)
 */
export function logWithContext(message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const vu = __VU;
  const iter = __ITER;

  if (data) {
    console.log(`[${timestamp}] [VU:${vu}, Iter:${iter}] ${message}`, JSON.stringify(data));
  } else {
    console.log(`[${timestamp}] [VU:${vu}, Iter:${iter}] ${message}`);
  }
}

/**
 * Log an error with context
 * @param message - Error message
 * @param error - Error object or additional context
 */
export function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  const vu = __VU;
  console.error(`[${timestamp}] [VU:${vu}] ERROR: ${message}`, error || '');
}
