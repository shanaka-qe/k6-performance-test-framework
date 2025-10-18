# 📏 Code Conventions & Standards

This document defines coding standards, naming conventions, and best practices for the k6 Performance Testing Framework.

---

## 📝 General Principles

1. **Clarity over Cleverness**: Code should be self-explanatory
2. **Consistency**: Follow established patterns
3. **Modularity**: DRY (Don't Repeat Yourself)
4. **Type Safety**: Leverage TypeScript for better maintainability
5. **Documentation**: Comment why, not what

---

## 🗂️ File Structure & Naming

### Directory Organization

```
scripts/
├── <test-type>/          # Test type directory (smoke, load, stress, etc.)
│   └── api_<flow>_<type>.ts    # Test script
└── scenarios/             # Reusable scenario modules
    └── <scenario-name>.ts
```

### File Naming Conventions

#### Test Scripts

Format: `api_<flow>_<type>.ts`

Examples:

- `api_mainflow_load.ts`
- `api_checkout_stress.ts`
- `api_auth_smoke.ts`

#### Library Modules

Format: `<module-name>.ts` (camelCase)

Examples:

- `httpClient.ts`
- `auth.ts`
- `metrics.ts`

#### Scenario Modules

Format: `<scenario-name>.ts` (camelCase)

Examples:

- `login.ts`
- `checkout.ts`
- `common.ts`

---

## 🎯 TypeScript Standards

### Import Statements

```typescript
// External imports first
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { SharedArray } from 'k6/data';

// Internal imports second (grouped)
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';
import { checkApiSuccess } from '../../lib/checks';

// Scenario imports last
import { executeLogin } from '../scenarios/login';
```

### Type Definitions

```typescript
// Always define interfaces for complex objects
interface UserCredentials {
  username: string;
  password: string;
  role?: string;
}

// Use type for simpler types or unions
type TestType = 'smoke' | 'load' | 'stress' | 'soak' | 'spike';

// Prefer interfaces for objects, types for primitives/unions
```

### Function Signatures

```typescript
// Always specify parameter and return types
export function executeLogin(
  httpClient: HttpClient,
  config: Config,
  username: string,
  password: string
): string | null {
  // Implementation
}

// Use optional parameters with defaults
export function getLoadScenario(rate: number = 10, duration: string = '5m') {
  // Implementation
}
```

---

## 🔤 Naming Conventions

### Variables

```typescript
// camelCase for variables and functions
const httpClient = new HttpClient(config);
let accessToken = null;

// SCREAMING_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;

// Descriptive names
const userCredentials = loadUserData(); // Good
const data = loadUserData(); // Avoid
```

### Functions

```typescript
// Verb + Noun pattern for functions
function executeLogin() {}
function fetchUserProfile() {}
function checkApiResponse() {}

// Boolean functions should start with is/has/should
function isValidToken() {}
function hasExpired() {}
function shouldRetry() {}

// Avoid generic names
function process() {} // Bad
function validate() {} // Bad
function processOrder() {} // Good
function validateEmail() {} // Good
```

### Classes

```typescript
// PascalCase for classes
class HttpClient {}
class AuthManager {}
class MetricsCollector {}
```

### Interfaces & Types

```typescript
// PascalCase with descriptive names
interface RequestParams {}
interface TokenResponse {}
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

---

## 📦 Test Script Structure

### Standard Template

```typescript
/**
 * <Test Type> Test Script
 * Purpose: <Brief description>
 * Duration: <Expected duration>
 * Load: <Load pattern>
 * Use: <When to run this test>
 */

// Imports
import { Options } from 'k6/options';
import { loadConfig, getEnvironment } from '../../lib/env';

// Configuration
const config = loadConfig(getEnvironment());

// Test Options
export const options: Options = {
  scenarios: {
    // Scenario definition
  },
  thresholds: {
    // Threshold definitions
  },
  tags: {
    // Common tags
  },
};

// Setup function (optional)
export function setup() {
  console.log('=== Test Starting ===');
  return { config };
}

// Main test function
export default function (data: any) {
  // Test implementation
}

// Teardown function (optional)
export function teardown(data: any) {
  console.log('=== Test Complete ===');
}
```

### Test Organization

```typescript
export default function (data: any) {
  // 1. Setup
  const httpClient = new HttpClient(config);

  // 2. Execute steps (clearly commented)
  // Step 1: Login
  const token = executeLogin(httpClient, config, user.username, user.password);
  thinkTime(2, 0.3);

  // Step 2: Browse products
  const products = browseProducts(httpClient, config);
  thinkTime(3, 0.5);

  // Step 3: Checkout
  const orderId = executeCheckout(httpClient, config, cartItems);

  // 3. Cleanup (if needed)
}
```

---

## 💬 Comments & Documentation

### File-Level Comments

```typescript
/**
 * Module Name
 * Brief description of what this module does
 * Key responsibilities and usage notes
 */
```

### Function Comments

```typescript
/**
 * Brief description of what the function does
 * @param paramName - Description of parameter
 * @param anotherParam - Description of another parameter
 * @returns Description of return value
 */
export function functionName(paramName: string, anotherParam: number): ReturnType {
  // Implementation
}
```

### Inline Comments

```typescript
// Explain WHY, not WHAT
// Good: Calculate backoff delay with exponential increase
const delay = initialDelay * Math.pow(multiplier, attempt);

// Bad: Multiply initialDelay by multiplier to the power of attempt
const delay = initialDelay * Math.pow(multiplier, attempt);

// Use comments to explain complex logic
// Don't comment obvious code
```

### Section Comments

```typescript
// ============================================================================
// AUTHENTICATION SECTION
// ============================================================================

// ========================================================================
// Step 1: User Login
// ========================================================================
```

---

## 🏷️ Tags & Metrics

### Metric Naming

```typescript
// Use descriptive names with context
const loginDuration = new Trend('login_duration', true);
const checkoutSuccessRate = new Rate('checkout_success_rate');

// Include units in metric names when applicable
const responseTimeMs = new Trend('response_time_ms');

// Use consistent naming patterns
// <action>_<metric_type>
// Examples: login_duration, checkout_success_rate, search_error_total
```

### Tag Naming

```typescript
// Use snake_case for tag keys
tags: {
  environment: config.environment,
  test_type: 'load',
  endpoint: 'products_list',
  flow: 'main_user_flow',
  method: 'GET',
}

// Keep tags consistent across tests
// Standard tags: environment, test_type, endpoint, flow, method
```

---

## ✅ Checks & Assertions

### Check Naming

```typescript
// Descriptive check names
check(response, {
  'status is 200': (r) => r.status === 200,
  'response has user data': (r) => r.json('user') !== undefined,
  'response time < 500ms': (r) => r.timings.duration < 500,
});

// Avoid generic names
check(response, {
  success: (r) => r.status === 200, // Too vague
  valid: (r) => r.json('user') !== undefined, // Too vague
});
```

### Using Check Helpers

```typescript
// Prefer helper functions for consistency
import { checkApiSuccess, checkJsonFields } from '../../lib/checks';

// Good
checkApiSuccess(response, 1000);
checkJsonFields(response, ['id', 'name', 'email']);

// Instead of
check(response, {
  'status is 200': (r) => r.status === 200,
  'content-type is JSON': (r) => r.headers['Content-Type'].includes('json'),
});
```

---

## 🔄 Error Handling

### Standard Pattern

```typescript
// Check for errors and handle gracefully
const response = httpClient.get('/api/users');

if (response.status !== 200) {
  console.error(`API call failed: ${response.status} - ${response.body}`);
  return; // Exit iteration gracefully
}

// Don't let errors crash the entire test
try {
  const data = JSON.parse(response.body);
  // Process data
} catch (error) {
  console.error('Failed to parse response:', error);
  return;
}
```

### Logging

```typescript
// Use appropriate log levels

// Debug information (only when debugging)
if (config.features?.debugMode) {
  console.log('Debug: Token fetched successfully');
}

// Important events
console.log(`VU ${__VU} completed iteration ${__ITER}`);

// Warnings
console.warn('High latency detected: 3000ms');

// Errors
console.error('Login failed:', response.status, response.body);
```

---

## 🎨 Code Style

### Formatting

- **Indentation**: 2 spaces (configured in `.editorconfig`)
- **Line Length**: Max 100 characters (configured in `.prettierrc`)
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings
- **Trailing Commas**: ES5 style

### Automated Formatting

```bash
# Format code automatically
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 📊 Thresholds

### Threshold Definitions

```typescript
// Use descriptive threshold names and comments
thresholds: {
  // Error rate should be less than 2%
  http_req_failed: ['rate<0.02'],

  // 95th percentile response time should be under 800ms
  'http_req_duration{expected_response:true}': ['p(95)<800'],

  // Custom metric thresholds
  login_success_rate: ['rate>0.95'],  // 95% of logins should succeed
  checkout_duration: ['p(95)<3000'],  // Checkout p95 < 3 seconds
}
```

---

## 🧪 Test Data

### CSV Format

```csv
# First line is header
username,password,email,role
user1,pass1,user1@example.com,standard
user2,pass2,user2@example.com,premium
```

### JSON Payloads

```json
{
  "orderId": "{{ORDER_ID}}",
  "customerId": "{{CUSTOMER_ID}}",
  "items": []
}
```

Use placeholders (`{{VARIABLE}}`) for dynamic values

---

## 🔐 Security

### Never Commit Secrets

```typescript
// ❌ Bad - hardcoded credentials
const clientId = 'abc123';
const clientSecret = 'secret456';

// ✅ Good - use environment variables
const clientId = __ENV.CLIENT_ID || config.auth.clientId;
const clientSecret = __ENV.CLIENT_SECRET;
```

### Sensitive Data

- Use `.env` files (gitignored)
- Store secrets in CI/CD secret management
- Never log secrets or tokens

---

## 🚀 Performance Best Practices

### Efficient Code

```typescript
// Load test data once, share across VUs
const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users.json'));
});

// Avoid expensive operations in VU code
// Bad: Parsing large files in every iteration
export default function () {
  const data = JSON.parse(open('../data/large_file.json')); // ❌
}

// Good: Parse once in setup or use SharedArray
const data = new SharedArray('data', () => {
  return JSON.parse(open('../data/large_file.json')); // ✅
});
```

### Think Time

```typescript
// Use realistic think time
thinkTime(3, 0.5); // 3 seconds ± 50%

// Don't use fixed sleep
sleep(3); // Less realistic

// Model realistic user behavior
// After viewing product: 3-7 seconds
thinkTime(5, 0.4);

// After adding to cart: 1-3 seconds
thinkTime(2, 0.5);
```

---

## 📋 Code Review Checklist

### Before Submitting PR

- [ ] Code follows naming conventions
- [ ] Functions have type annotations
- [ ] Complex logic is commented
- [ ] Tests run successfully locally
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting is correct (`npm run format:check`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] No secrets or credentials in code
- [ ] Test data is in appropriate directory
- [ ] Documentation is updated if needed

### Reviewer Checklist

- [ ] Code is clear and maintainable
- [ ] Follows established patterns
- [ ] Thresholds are appropriate
- [ ] Error handling is present
- [ ] Test scenarios are realistic
- [ ] Performance considerations addressed
- [ ] No security issues

---

## 🔄 Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build/tooling changes

### Examples

```
feat(load-test): add product search scenario

Added new search scenario with filters and pagination.
Includes realistic think times and error handling.

Closes #123

---

fix(auth): handle token expiration gracefully

Previously, expired tokens caused test failures.
Now tokens are automatically refreshed.

---

docs(runbook): update Docker commands

Added section on custom image building.
```

---

**Document Owner**: Performance Engineering Team  
**Last Updated**: 2025-01-18
