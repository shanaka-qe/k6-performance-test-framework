# 🎯 Load Modeling & Scenario Design

This document explains how to model realistic traffic patterns, design performance test scenarios, and configure k6 executors for different test types.

---

## 📊 Understanding Load Patterns

### Virtual Users (VUs) vs Arrival Rate

#### Virtual Users (VU-Based)

- **Definition**: Number of concurrent users executing the script
- **Behavior**: Each VU runs the script repeatedly
- **Use Case**: Simple tests, browser-based scenarios

```typescript
scenarios: {
  constant_vus: {
    executor: 'constant-vus',
    vus: 50,        // 50 concurrent users
    duration: '5m',
  }
}
```

#### Arrival Rate (Request-Based)

- **Definition**: Number of iterations started per time unit
- **Behavior**: k6 manages VUs to maintain target rate
- **Use Case**: Realistic API testing, production-like traffic

```typescript
scenarios: {
  constant_arrival: {
    executor: 'constant-arrival-rate',
    rate: 100,      // 100 iterations per second
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 50,
    maxVUs: 200,
  }
}
```

### Why Arrival Rate is Better

- **Realistic**: Mirrors how real users access APIs
- **Predictable**: Consistent load regardless of response times
- **SLA-Focused**: Directly tests target RPS
- **Scalable**: k6 auto-adjusts VUs as needed

---

## 🔧 k6 Executors

### 1. constant-vus

**Use Case**: Simple smoke tests, debugging

```typescript
scenarios: {
  smoke_test: {
    executor: 'constant-vus',
    vus: 5,           // Fixed number of VUs
    duration: '30s',  // Test duration
  }
}
```

**Characteristics**:
- Fixed VUs throughout test
- Simplest executor
- Throughput varies with response time

---

### 2. ramping-vus

**Use Case**: Gradual load increase/decrease

```typescript
scenarios: {
  ramp_up: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { target: 10, duration: '1m' },  // Ramp up to 10 VUs over 1 min
      { target: 50, duration: '3m' },  // Ramp up to 50 VUs over 3 min
      { target: 50, duration: '5m' },  // Stay at 50 VUs for 5 min
      { target: 0, duration: '1m' },   // Ramp down to 0 over 1 min
    ],
  }
}
```

**Characteristics**:
- Gradual load changes
- Good for warm-up periods
- Throughput still varies with response time

---

### 3. constant-arrival-rate ⭐ (Recommended)

**Use Case**: Load testing with fixed RPS

```typescript
scenarios: {
  load_test: {
    executor: 'constant-arrival-rate',
    rate: 100,            // 100 iterations/second
    timeUnit: '1s',       // Per second
    duration: '10m',      // Test duration
    preAllocatedVUs: 50,  // Initial VUs
    maxVUs: 200,          // Max VUs if needed
    gracefulStop: '30s',  // Wait time for iterations to finish
  }
}
```

**Characteristics**:
- Fixed iteration rate
- k6 auto-scales VUs
- **Best for API load testing**
- Directly models target RPS

**Calculating VUs**:
```
Required VUs = (target RPS × avg iteration time) + buffer

Example:
- Target: 100 RPS
- Avg iteration time: 2 seconds
- Required VUs: 100 × 2 = 200 VUs
- With buffer: preAllocatedVUs: 150, maxVUs: 300
```

---

### 4. ramping-arrival-rate ⭐ (Stress Testing)

**Use Case**: Stress tests, finding breaking points

```typescript
scenarios: {
  stress_test: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 500,
    stages: [
      { target: 50, duration: '2m' },   // Ramp to 50 rps
      { target: 100, duration: '3m' },  // Ramp to 100 rps
      { target: 200, duration: '3m' },  // Ramp to 200 rps
      { target: 300, duration: '2m' },  // Spike to 300 rps
      { target: 0, duration: '1m' },    // Ramp down
    ],
  }
}
```

**Characteristics**:
- Progressive load increase
- Find system limits
- Auto-scaling VUs
- **Best for capacity testing**

---

### 5. shared-iterations

**Use Case**: Fixed number of iterations across VUs

```typescript
scenarios: {
  shared_test: {
    executor: 'shared-iterations',
    vus: 10,
    iterations: 200,  // Total 200 iterations across 10 VUs
    maxDuration: '1h',
  }
}
```

**Characteristics**:
- Fixed total iterations
- Shared across VUs
- Good for data-driven tests

---

### 6. per-vu-iterations

**Use Case**: Each VU executes fixed iterations

```typescript
scenarios: {
  per_vu_test: {
    executor: 'per-vu-iterations',
    vus: 10,
    iterations: 20,  // Each VU runs 20 iterations (200 total)
    maxDuration: '1h',
  }
}
```

**Characteristics**:
- Each VU runs same iterations
- Predictable total load
- Good for smoke tests

---

### 7. externally-controlled

**Use Case**: Dynamic control during test

```typescript
scenarios: {
  external_control: {
    executor: 'externally-controlled',
    vus: 10,
    maxVUs: 100,
    duration: '10m',
  }
}
```

**Characteristics**:
- Control via k6 REST API
- Dynamic load adjustment
- Advanced use cases

---

## 🎭 Scenario Composition

### Multiple Scenarios

Run different scenarios in parallel:

```typescript
scenarios: {
  // 80% of traffic: normal browsing
  browsing: {
    executor: 'constant-arrival-rate',
    rate: 80,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 50,
    maxVUs: 150,
    exec: 'browsingScenario',  // Function name
  },
  
  // 15% of traffic: search
  searching: {
    executor: 'constant-arrival-rate',
    rate: 15,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 10,
    maxVUs: 30,
    exec: 'searchScenario',
  },
  
  // 5% of traffic: checkout
  checkout: {
    executor: 'constant-arrival-rate',
    rate: 5,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 5,
    maxVUs: 20,
    exec: 'checkoutScenario',
  },
}

// Define scenario functions
export function browsingScenario(data) {
  // Browse products implementation
}

export function searchScenario(data) {
  // Search implementation
}

export function checkoutScenario(data) {
  // Checkout implementation
}
```

---

## ⏱️ Think Time & Pacing

### Think Time

Simulates user reading/thinking between actions:

```typescript
import { thinkTime } from '../../lib/utils';

// User reads product details (3-7 seconds)
thinkTime(5, 0.4);  // 5 seconds ± 40% = 3-7 seconds

// User adds to cart (1-3 seconds)
thinkTime(2, 0.5);  // 2 seconds ± 50% = 1-3 seconds

// User completes payment (5-15 seconds)
thinkTime(10, 0.5);  // 10 seconds ± 50% = 5-15 seconds
```

### Pacing

Ensures minimum time between iterations:

```typescript
import { pace, now } from '../../lib/utils';

export default function() {
  const iterationStart = now();
  
  // Execute test steps
  doLogin();
  browseProducts();
  checkout();
  
  // Ensure iteration takes at least 60 seconds
  pace(iterationStart, 60);
}
```

### When to Use Each

| Use | Think Time | Pacing |
|-----|------------|--------|
| **Purpose** | Simulate user behavior | Control iteration rate |
| **Placement** | Between steps | End of iteration |
| **Load Pattern** | Realistic user flow | Consistent throughput |
| **Example** | User reads page | API polling |

---

## 📦 Test Data Strategies

### 1. Shared Data (Memory Efficient)

```typescript
import { SharedArray } from 'k6/data';

// Loaded once, shared across all VUs
const users = new SharedArray('users', function() {
  return JSON.parse(open('../data/users.json'));
});

export default function() {
  const user = users[__VU % users.length];
  // Use user
}
```

### 2. Per-VU Data

```typescript
let vuData;

export function setup() {
  return {
    users: loadAllUsers(),
  };
}

export default function(data) {
  // Each VU gets unique data
  if (!vuData) {
    vuData = data.users[__VU - 1];
  }
  // Use vuData
}
```

### 3. Dynamic Data Generation

```typescript
import { generateUuid, generateEmail } from '../../lib/utils';

export default function() {
  const newUser = {
    id: generateUuid(),
    email: generateEmail(),
    timestamp: new Date().toISOString(),
  };
  // Use newUser
}
```

---

## 🎯 Realistic Traffic Modeling

### Production Traffic Analysis

1. **Analyze Production Logs**
   ```
   - Average RPS: 100
   - Peak RPS: 300
   - Endpoint distribution:
     * GET /products: 40%
     * GET /search: 30%
     * POST /orders: 10%
     * Other: 20%
   ```

2. **Model in k6**
   ```typescript
   scenarios: {
     products: {
       executor: 'constant-arrival-rate',
       rate: 40,  // 40% of 100 RPS
       exec: 'browseProducts',
     },
     search: {
       executor: 'constant-arrival-rate',
       rate: 30,  // 30% of 100 RPS
       exec: 'search',
     },
     orders: {
       executor: 'constant-arrival-rate',
       rate: 10,  // 10% of 100 RPS
       exec: 'createOrder',
     },
   }
   ```

### User Journey Modeling

```typescript
export default function() {
  // 100% users: Login
  const token = executeLogin(httpClient, config, user.username, user.password);
  thinkTime(2, 0.3);
  
  // 80% users: Browse products
  if (Math.random() < 0.8) {
    browseProducts(httpClient, config);
    thinkTime(5, 0.5);
  }
  
  // 50% of browsers: Search
  if (Math.random() < 0.5) {
    searchProducts(httpClient, config, 'laptop');
    thinkTime(3, 0.4);
  }
  
  // 20% of users: Complete checkout
  if (Math.random() < 0.2) {
    executeCheckout(httpClient, config, cartItems);
    thinkTime(10, 0.5);
  }
  
  // All users: View profile occasionally
  if (Math.random() < 0.3) {
    viewProfile(httpClient, config);
  }
}
```

---

## 📈 Performance Profiles

### Profile 1: Baseline Load

```typescript
// Constant expected load
scenarios: {
  baseline: {
    executor: 'constant-arrival-rate',
    rate: 100,
    timeUnit: '1s',
    duration: '30m',
    preAllocatedVUs: 100,
    maxVUs: 200,
  }
}
```

### Profile 2: Stress Ramp

```typescript
// Find breaking point
scenarios: {
  stress: {
    executor: 'ramping-arrival-rate',
    startRate: 50,
    timeUnit: '1s',
    stages: [
      { target: 100, duration: '5m' },
      { target: 200, duration: '5m' },
      { target: 400, duration: '5m' },
      { target: 800, duration: '5m' },
    ],
    preAllocatedVUs: 200,
    maxVUs: 1000,
  }
}
```

### Profile 3: Spike Pattern

```typescript
// Sudden traffic bursts
scenarios: {
  spike: {
    executor: 'ramping-arrival-rate',
    startRate: 50,
    timeUnit: '1s',
    stages: [
      { target: 50, duration: '2m' },    // Baseline
      { target: 500, duration: '30s' },  // Spike!
      { target: 50, duration: '2m' },    // Back to baseline
      { target: 1000, duration: '30s' }, // Bigger spike!
      { target: 50, duration: '2m' },    // Recovery
    ],
    preAllocatedVUs: 100,
    maxVUs: 1200,
  }
}
```

### Profile 4: Soak Test

```typescript
// Sustained load
scenarios: {
  soak: {
    executor: 'constant-arrival-rate',
    rate: 50,      // Moderate load
    timeUnit: '1s',
    duration: '4h', // Extended duration
    preAllocatedVUs: 50,
    maxVUs: 100,
  }
}
```

---

## 🔍 Monitoring & Adjustments

### Real-Time Monitoring

```typescript
export default function() {
  const startTime = now();
  
  // Execute test logic
  const response = httpClient.get('/api/products');
  
  const elapsed = duration(startTime);
  
  // Log slow requests
  if (elapsed > 2000) {
    console.warn(`Slow request: ${elapsed}ms`);
  }
  
  // Periodic status
  if (__ITER % 100 === 0) {
    console.log(`VU ${__VU}: ${__ITER} iterations, last: ${elapsed}ms`);
  }
}
```

---

**Document Owner**: Performance Engineering Team  
**Last Updated**: 2025-01-18

