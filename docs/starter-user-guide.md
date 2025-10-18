# 🚀 Starter User Guide

Welcome to the k6 Performance Testing Framework! This comprehensive guide will walk you through setting up, configuring, and running your first performance tests.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running Your First Test](#running-your-first-test)
- [Understanding Results](#understanding-results)
- [Customizing Tests](#customizing-tests)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

Before you begin, ensure you have the following installed:

#### 1. Node.js (18+)

```bash
# Check if Node.js is installed
node --version

# If not installed, download from https://nodejs.org/
# Or use a package manager:
# macOS: brew install node
# Windows: choco install nodejs
# Linux: sudo apt install nodejs npm
```

#### 2. k6 (0.48.0+)

```bash
# Check if k6 is installed
k6 version

# Installation options:
# macOS: brew install k6
# Windows: choco install k6
# Linux: sudo snap install k6
# Or download from: https://k6.io/docs/get-started/installation/
```

#### 3. Docker (Optional but Recommended)

```bash
# Check if Docker is installed
docker --version
docker-compose --version

# If not installed:
# Download from: https://www.docker.com/products/docker-desktop
```

#### 4. Git

```bash
# Check if Git is installed
git --version

# If not installed:
# macOS: xcode-select --install
# Windows: Download from https://git-scm.com/
# Linux: sudo apt install git
```

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB+
- **CPU**: 2+ cores recommended
- **Storage**: 1GB free space
- **Network**: Internet connection for downloading dependencies

---

## Installation

### Step 1: Clone the Repository

```bash
# Clone the framework
git clone https://github.com/your-org/k6-performance-test-framework.git
cd k6-performance-test-framework

# Verify the structure
ls -la
```

You should see:

```
k6-performance-test-framework/
├── lib/                    # Core framework libraries
├── scripts/                # Test scripts
├── env/                    # Environment configurations
├── data/                   # Test data
├── tools/                  # Docker & observability
├── docs/                   # Documentation
├── package.json
└── README.md
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list
```

### Step 3: Verify Setup

```bash
# Run linting to check code quality
npm run lint

# Run type checking
npm run type-check

# Test k6 installation
k6 version
```

If all commands succeed, you're ready to start!

---

## Quick Start

### Option 1: Local Execution (Fastest)

```bash
# Run a simple smoke test
npm run test:smoke

# Or run directly with k6
k6 run scripts/smoke/api_smoke.ts
```

### Option 2: Docker Execution (Recommended)

```bash
# Start the observability stack
npm run docker:up

# Wait for services to be ready (30-60 seconds)
# Check status
docker-compose -f docker/docker-compose.yml ps

# Run a test in Docker
npm run docker:test

# View results in Grafana
open http://localhost:3000  # admin/admin
```

### Option 3: Full Docker Stack

```bash
# Start everything
docker-compose -f docker/docker-compose.yml up -d

# Run a specific test
docker-compose -f docker/docker-compose.yml run --rm k6 run /scripts/load/api_load_mainflow.ts

# Stop when done
docker-compose -f docker/docker-compose.yml down
```

---

## Configuration

### Understanding Environment Configuration

The framework uses a layered configuration approach:

1. **common.json** - Base settings shared across all environments
2. **{env}.json** - Environment-specific settings (dev/sit/uat)
3. **Environment Variables** - Runtime overrides (highest priority)

### Step 1: Configure Your API Endpoints

Edit the environment configuration files:

```bash
# Open development environment config
vi env/dev.json
```

Update the following sections:

```json
{
  "baseUrl": "https://your-api-dev.example.com",
  "auth": {
    "clientId": "your-client-id",
    "authUrl": "https://your-auth-dev.example.com"
  },
  "endpoints": {
    "health": "/health",
    "login": "/api/v1/auth/login",
    "users": "/api/v1/users",
    "products": "/api/v1/products",
    "orders": "/api/v1/orders",
    "search": "/api/v1/search"
  }
}
```

### Step 2: Add Test Data

```bash
# Update user data for your environment
vi data/users_dev.csv
```

Format:

```csv
username,password,email,role
testuser1,Password123!,testuser1@example.com,user
testuser2,Password123!,testuser2@example.com,premium
```

### Step 3: Set Environment Variables (Optional)

```bash
# Override configuration at runtime
export BASE_URL=https://api-custom.example.com
export CLIENT_ID=my-client-id
export CLIENT_SECRET=my-secret
export VUS=20
export DURATION=5m
```

---

## Running Your First Test

### Test 1: Smoke Test (Health Check)

```bash
# Run smoke test against development environment
k6 run --env ENV=dev scripts/smoke/api_smoke.ts
```

**What it does:**

- Tests basic connectivity
- Validates health endpoints
- Quick 1-2 minute test
- Minimal load (1-5 VUs)

**Expected output:**

```
     ✓ status is 2xx
     ✓ health check successful
     ✓ users endpoint accessible
     ✓ products endpoint accessible
     ✓ search endpoint accessible

     checks.........................: 5     0.00/s
     data_received..................: 2.1 kB 35 B/s
     data_sent......................: 1.2 kB 20 B/s
     http_req_duration..............: avg=45ms min=12ms med=42ms max=89ms p(90)=67ms p(95)=78ms
     http_req_failed.................: 0.00% ✓ 0 ✗ 5
     http_reqs......................: 5      0.08/s
     iteration_duration.............: avg=1.2s min=1.1s med=1.2s max=1.3s p(90)=1.3s p(95)=1.3s
     iterations.....................: 1      0.02/s
     vus............................: 1      min=1 max=1
     vus_max........................: 1      min=1 max=1
```

### Test 2: Load Test (Performance Validation)

```bash
# Run load test
k6 run --env ENV=dev scripts/load/api_load_mainflow.ts
```

**What it does:**

- Simulates realistic user behavior
- Tests performance under expected load
- Validates SLAs and thresholds
- 5-30 minute duration

### Test 3: Stress Test (Find Breaking Points)

```bash
# Run stress test
k6 run --env ENV=dev scripts/stress/api_stress.ts
```

**What it does:**

- Progressively increases load
- Finds system capacity limits
- Identifies bottlenecks
- Tests resilience

---

## Understanding Results

### Key Metrics Explained

#### Response Time Metrics

- **avg**: Average response time
- **p(95)**: 95th percentile (95% of requests faster than this)
- **p(99)**: 99th percentile (99% of requests faster than this)

#### Success Metrics

- **http_req_failed**: Percentage of failed requests
- **checks**: Percentage of successful checks
- **iterations**: Number of completed test iterations

#### Load Metrics

- **vus**: Current virtual users
- **http_reqs**: Total HTTP requests
- **data_received/sent**: Network throughput

### Interpreting Results

#### ✅ Good Results

```
http_req_failed.................: 0.00% ✓ 0 ✗ 100
http_req_duration..............: avg=200ms p(95)=400ms p(99)=800ms
checks.........................: 100.00% ✓ 100 ✗ 0
```

#### ⚠️ Warning Signs

```
http_req_failed.................: 2.50% ✓ 97 ✗ 3
http_req_duration..............: avg=800ms p(95)=2000ms p(99)=5000ms
checks.........................: 95.00% ✓ 95 ✗ 5
```

#### ❌ Failed Results

```
http_req_failed.................: 15.00% ✓ 85 ✗ 15
http_req_duration..............: avg=3000ms p(95)=8000ms p(99)=15000ms
checks.........................: 80.00% ✓ 80 ✗ 20
```

### Using Grafana for Visualization

If you're using Docker:

```bash
# Access Grafana
open http://localhost:3000

# Login: admin/admin
# Navigate to "k6 Performance Overview" dashboard
```

Key panels to watch:

- **Request Rate**: Requests per second over time
- **Error Rate**: Percentage of failed requests
- **Response Time**: P50, P95, P99 latencies
- **Virtual Users**: Current active users

---

## Customizing Tests

### Adding Your Own Test Script

```bash
# Create a new test script
cp scripts/load/api_load_mainflow.ts scripts/load/my_custom_test.ts

# Edit the script
vi scripts/load/my_custom_test.ts
```

Basic template:

```typescript
/**
 * My Custom Test
 * Purpose: Test specific functionality
 */

import { Options } from 'k6/options';
import { loadConfig, getEnvironment } from '../../lib/env';
import { HttpClient } from '../../lib/httpClient';

const config = loadConfig(getEnvironment());

export const options: Options = {
  scenarios: {
    my_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const httpClient = new HttpClient(config);

  // Your test logic here
  const response = httpClient.get('/api/my-endpoint');

  // Add checks
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
```

### Modifying Test Data

```bash
# Update user data
vi data/users_dev.csv

# Add new payload templates
vi data/payloads/my_payload.json
```

### Adjusting Load Parameters

```bash
# Override VUs and duration
k6 run \
  --env ENV=dev \
  --env VUS=50 \
  --env DURATION=10m \
  scripts/load/api_load_mainflow.ts
```

---

## Common Scenarios

### Scenario 1: Testing a New API Endpoint

```typescript
// 1. Add endpoint to environment config
// env/dev.json
{
  "endpoints": {
    "myNewEndpoint": "/api/v1/my-new-endpoint"
  }
}

// 2. Create test function
export default function() {
  const httpClient = new HttpClient(config);

  // Test the new endpoint
  const response = httpClient.get(config.endpoints.myNewEndpoint);

  // Validate response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Scenario 2: Testing Authentication Flow

```typescript
import { executeLogin } from '../scenarios/login';

export default function () {
  const httpClient = new HttpClient(config);

  // Login first
  const token = executeLogin(httpClient, config, 'username', 'password');

  if (!token) {
    console.error('Login failed');
    return;
  }

  // Now test authenticated endpoints
  const response = httpClient.get('/api/protected-endpoint');
  // ... rest of test
}
```

### Scenario 3: Testing with Different User Types

```typescript
import { selectRandom } from '../../lib/utils';

const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users_dev.csv'));
});

export default function () {
  const user = selectRandom(users);

  // Test based on user role
  if (user.role === 'premium') {
    testPremiumFeatures();
  } else {
    testBasicFeatures();
  }
}
```

### Scenario 4: Testing Error Scenarios

```typescript
export default function () {
  const httpClient = new HttpClient(config);

  // Test with invalid data
  const response = httpClient.post('/api/orders', {
    invalidField: 'invalidValue',
  });

  // Expect error response
  check(response, {
    'status is 400': (r) => r.status === 400,
    'error message present': (r) => r.body.includes('error'),
  });
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Connection Refused

**Symptoms:**

```
dial tcp: connection refused
```

**Solutions:**

```bash
# Check if API is running
curl https://your-api-dev.example.com/health

# Verify BASE_URL in config
cat env/dev.json | grep baseUrl

# Test network connectivity
ping your-api-dev.example.com
```

#### Issue 2: Authentication Failures

**Symptoms:**

```
401 Unauthorized
```

**Solutions:**

```bash
# Check credentials
echo $CLIENT_ID
echo $CLIENT_SECRET

# Test auth endpoint manually
curl -X POST https://your-auth.example.com/oauth/token \
  -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"

# Verify auth endpoint in config
cat env/dev.json | grep -A 5 auth
```

#### Issue 3: High Error Rates

**Symptoms:**

```
http_req_failed: 15.00%
```

**Solutions:**

```bash
# Reduce load and retry
k6 run --env VUS=5 --env DURATION=2m scripts/load/api_load_mainflow.ts

# Check server logs
# Review API documentation for rate limits
# Verify test data is valid
```

#### Issue 4: Slow Response Times

**Symptoms:**

```
http_req_duration: avg=5000ms
```

**Solutions:**

```bash
# Test individual endpoints
k6 run --iterations 10 --vus 1 scripts/smoke/api_smoke.ts

# Check infrastructure metrics
# Review database performance
# Verify network latency
```

#### Issue 5: Docker Issues

**Symptoms:**

```
docker: command not found
```

**Solutions:**

```bash
# Install Docker Desktop
# Or run tests locally without Docker
k6 run scripts/smoke/api_smoke.ts
```

### Debug Mode

Enable detailed logging:

```bash
# Run with verbose output
k6 run --verbose scripts/smoke/api_smoke.ts

# Enable HTTP debugging
k6 run --http-debug scripts/smoke/api_smoke.ts

# Set debug in environment
k6 run --env DEBUG=true scripts/smoke/api_smoke.ts
```

### Getting Help

1. **Check Documentation**: Review [docs/](docs/) folder
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Ask Questions**: Create a GitHub issue with:
   - Error messages
   - Configuration files
   - Steps to reproduce
   - Environment details

---

## Next Steps

### Immediate Actions

1. **Run All Test Types**:

   ```bash
   npm run test:smoke
   npm run test:load
   npm run test:stress
   ```

2. **Explore Grafana Dashboards**:

   ```bash
   npm run docker:up
   open http://localhost:3000
   ```

3. **Customize for Your API**:
   - Update environment configs
   - Add your test data
   - Modify test scenarios

### Intermediate Steps

1. **Set Up CI/CD**:
   - Configure GitHub Actions
   - Set up Jenkins pipeline
   - Configure secrets

2. **Create Custom Tests**:
   - Add your specific scenarios
   - Create custom metrics
   - Design realistic user flows

3. **Production Readiness**:
   - Set up monitoring
   - Configure alerting
   - Establish baselines

### Advanced Usage

1. **Kubernetes Deployment**:
   - Use k6-operator
   - Scale across multiple nodes
   - Integrate with cluster monitoring

2. **Custom Extensions**:
   - Add xk6 extensions
   - Create custom output formats
   - Integrate with other tools

3. **Team Collaboration**:
   - Set up shared dashboards
   - Create test templates
   - Establish review processes

---

## 📚 Additional Resources

### Documentation

- [Test Strategy](test-strategy.md) - Performance requirements and SLAs
- [Runbook](runbook.md) - Operational procedures
- [Conventions](conventions.md) - Code standards
- [Modeling & Scenarios](modeling-and-scenarios.md) - Traffic patterns

### External Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

### Community

- [k6 Community](https://community.k6.io/)
- [GitHub Discussions](https://github.com/your-org/k6-performance-test-framework/discussions)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)

---

## 🎯 Success Checklist

Before moving to production:

- [ ] All test types run successfully
- [ ] Environment configurations updated
- [ ] Test data reflects real scenarios
- [ ] Thresholds match your SLAs
- [ ] CI/CD pipeline configured
- [ ] Monitoring dashboards set up
- [ ] Team trained on framework usage
- [ ] Documentation reviewed and updated

---

**Need Help?**

- Create an issue on GitHub
- Join our discussions
- Check the troubleshooting section above

**Happy Testing!** 🚀

---

**Document Owner**: Performance Engineering Team  
**Last Updated**: 2025-01-18  
**Next Review**: 2025-04-18
