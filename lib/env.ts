/**
 * Environment Configuration Module
 * Loads and merges configuration from JSON files and environment variables
 * Provides type-safe access to configuration across all test scripts
 */

import { readFile } from 'k6/x/file';

// Interface defining the structure of our configuration object
export interface Config {
  description?: string;
  environment: string;
  baseUrl: string;
  auth: {
    clientId: string;
    clientSecret?: string;
    authUrl: string;
    tokenEndpoint: string;
    refreshThreshold: number;
  };
  http: {
    timeout: string;
    maxRedirects: number;
    userAgent: string;
  };
  load: {
    vus: number;
    duration: string;
    rps: number;
  };
  data: {
    usersFile: string;
    payloadsPath: string;
  };
  endpoints: {
    [key: string]: string;
  };
  thresholds: {
    http_req_failed: {
      threshold: string;
      abortOnFail: boolean;
      delayAbortEval?: string;
    };
    http_req_duration: {
      p95: number;
      p99: number;
    };
  };
  tags: {
    [key: string]: string;
  };
  retry: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  features?: {
    detailedLogging: boolean;
    debugMode: boolean;
  };
}

/**
 * Load a JSON configuration file from the env directory
 * @param filename - Name of the JSON file to load (e.g., 'dev.json')
 * @returns Parsed JSON object or empty object if file doesn't exist
 */
function loadJsonConfig(filename: string): any {
  try {
    // Attempt to read the configuration file
    const content = readFile(`./env/${filename}`);
    // Parse the JSON content and return
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist or can't be parsed, log warning and return empty object
    console.warn(`Warning: Could not load config file env/${filename}:`, error);
    return {};
  }
}

/**
 * Deep merge two objects together
 * Later object properties override earlier ones
 * @param target - Base object
 * @param source - Object to merge into target
 * @returns Merged object
 */
function mergeDeep(target: any, source: any): any {
  // Create a copy of the target object to avoid mutation
  const output = { ...target };

  // If both target and source are objects, merge them recursively
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        // If the property is an object, merge recursively
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        // Otherwise, just copy the property
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Check if a value is a plain object
 * @param item - Value to check
 * @returns True if item is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Load and merge configuration for the specified environment
 * Merges common.json with environment-specific JSON, then applies env var overrides
 * @param env - Environment name (dev, sit, uat, etc.)
 * @returns Complete merged configuration object
 */
export function loadConfig(env: string = 'dev'): Config {
  // Step 1: Load common configuration shared across all environments
  const commonConfig = loadJsonConfig('common.json');

  // Step 2: Load environment-specific configuration
  const envConfig = loadJsonConfig(`${env}.json`);

  // Step 3: Merge common and environment configs (env config takes precedence)
  let config = mergeDeep(commonConfig, envConfig);

  // Step 4: Apply environment variable overrides (highest precedence)
  // These allow runtime customization without changing JSON files
  if (__ENV.BASE_URL) {
    config.baseUrl = __ENV.BASE_URL;
  }
  if (__ENV.CLIENT_ID) {
    config.auth = config.auth || {};
    config.auth.clientId = __ENV.CLIENT_ID;
  }
  if (__ENV.CLIENT_SECRET) {
    config.auth = config.auth || {};
    config.auth.clientSecret = __ENV.CLIENT_SECRET;
  }
  if (__ENV.VUS) {
    config.load = config.load || {};
    config.load.vus = parseInt(__ENV.VUS, 10);
  }
  if (__ENV.DURATION) {
    config.load = config.load || {};
    config.load.duration = __ENV.DURATION;
  }
  if (__ENV.RPS) {
    config.load = config.load || {};
    config.load.rps = parseInt(__ENV.RPS, 10);
  }

  // Step 5: Set the environment name in the config
  config.environment = env;

  // Step 6: Log the loaded configuration in debug mode
  if (config.features?.debugMode) {
    console.log('Loaded configuration:', JSON.stringify(config, null, 2));
  }

  return config;
}

/**
 * Get the current environment name from ENV environment variable
 * Defaults to 'dev' if not specified
 * @returns Environment name
 */
export function getEnvironment(): string {
  return __ENV.ENV || 'dev';
}

/**
 * Get a configuration value by dot-notation path
 * Example: getConfigValue(config, 'auth.clientId')
 * @param config - Configuration object
 * @param path - Dot-notation path to the value
 * @returns The value at the specified path or undefined
 */
export function getConfigValue(config: Config, path: string): any {
  return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), config as any);
}

