# 🚀 Performance Testing Runbook

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Execution](#local-execution)
- [Docker Execution](#docker-execution)
- [CI/CD Execution](#cicd-execution)
- [Kubernetes Execution](#kubernetes-execution)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)
- [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Tools

```bash
# k6 (version 0.48.0+)
brew install k6                    # macOS
choco install k6                   # Windows
sudo snap install k6               # Linux

# Node.js (version 18+)
node --version

# Docker (for observability stack)
docker --version
docker-compose --version
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/k6-performance-test-framework.git
cd k6-performance-test-framework

# Install dependencies
npm install

# Verify installation
npm run lint
npm run type-check
```

---

## Local Execution

### Running Individual Tests

```bash
# Smoke test (quick validation)
k6 run scripts/smoke/api_smoke.ts

# Load test (baseline performance)
k6 run scripts/load/api_load_mainflow.ts

# Stress test (find breaking points)
k6 run scripts/stress/api_stress.ts

# Soak test (endurance testing)
k6 run scripts/soak/api_soak.ts

# Spike test (burst resilience)
k6 run scripts/spike/api_spike.ts
```

### Using npm Scripts

```bash
# Predefined npm scripts
npm run test:smoke
npm run test:load
npm run test:stress
npm run test:soak
npm run test:spike
```

### Environment Selection

```bash
# Run against specific environment
k6 run --env ENV=dev scripts/smoke/api_smoke.ts
k6 run --env ENV=sit scripts/load/api_load_mainflow.ts
k6 run --env ENV=uat scripts/load/api_load_mainflow.ts
```

### Runtime Overrides

```bash
# Override configuration via environment variables
k6 run \
  --env ENV=sit \
  --env BASE_URL=https://api-custom.example.com \
  --env VUS=50 \
  --env DURATION=15m \
  --env RPS=100 \
  scripts/load/api_load_mainflow.ts

# Or export variables
export ENV=sit
export BASE_URL=https://api-sit.example.com
export VUS=30
k6 run scripts/load/api_load_mainflow.ts
```

### Output Options

```bash
# JSON output for analysis
k6 run --out json=results/test-results.json scripts/smoke/api_smoke.ts

# Multiple outputs
k6 run \
  --out json=results/test.json \
  --out csv=results/test.csv \
  scripts/load/api_load_mainflow.ts

# Prometheus remote write (requires xk6)
k6 run \
  --out experimental-prometheus-rw \
  scripts/load/api_load_mainflow.ts

# InfluxDB output
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  scripts/load/api_load_mainflow.ts
```

---

## Docker Execution

### Start Observability Stack

```bash
# Start Prometheus + Grafana
docker-compose -f tools/docker-compose.yml up -d

# Verify services are running
docker-compose -f tools/docker-compose.yml ps

# View logs
docker-compose -f tools/docker-compose.yml logs -f
```

### Run Tests in Docker

```bash
# Run test with docker-compose
docker-compose -f tools/docker-compose.yml run --rm k6 run /scripts/smoke/api_smoke.ts

# With environment override
docker-compose -f tools/docker-compose.yml run --rm \
  -e ENV=sit \
  k6 run /scripts/load/api_load_mainflow.ts

# Mount local changes
docker-compose -f tools/docker-compose.yml run --rm \
  -v $(pwd)/scripts:/scripts \
  k6 run /scripts/load/api_load_mainflow.ts
```

### Build Custom k6 Image

```bash
# Build image
docker build -t k6-perf-framework -f tools/Dockerfile .

# Run tests
docker run --rm \
  -v $(pwd)/results:/results \
  -e ENV=sit \
  k6-perf-framework run /scripts/load/api_load_mainflow.ts
```

### Stop Stack

```bash
# Stop services
docker-compose -f tools/docker-compose.yml down

# Stop and remove volumes
docker-compose -f tools/docker-compose.yml down -v
```

---

## CI/CD Execution

### GitHub Actions

#### Automatic Triggers

- **Pull Requests**: Smoke tests run automatically
- **Push to main**: Load tests run automatically
- **Scheduled**: Nightly stress/soak tests

#### Manual Trigger

1. Go to Actions tab in GitHub
2. Select "Performance Tests" workflow
3. Click "Run workflow"
4. Select:
   - Test type (smoke/load/stress/soak/spike)
   - Environment (dev/sit/uat)
5. Click "Run workflow"

#### Required Secrets

Configure in GitHub Settings → Secrets:

```
BASE_URL_DEV
BASE_URL_SIT
BASE_URL_UAT
CLIENT_ID
CLIENT_SECRET
GRAFANA_URL
PROMETHEUS_URL
SLACK_WEBHOOK_URL (optional)
```

### Jenkins

#### Trigger Build

1. Navigate to Jenkins job
2. Click "Build with Parameters"
3. Select:
   - **TEST_TYPE**: smoke/load/stress/soak/spike
   - **ENVIRONMENT**: dev/sit/uat
   - **VUS**: Number of virtual users
   - **DURATION**: Test duration
   - **FAIL_ON_THRESHOLD_BREACH**: true/false
4. Click "Build"

#### View Results

- **Console Output**: Real-time test execution
- **Artifacts**: JSON results and reports
- **Grafana Link**: Direct link to dashboard
- **Trend Graphs**: Historical comparison

---

## Kubernetes Execution

### Using k6-operator

#### Prerequisites

```bash
# Install k6-operator
kubectl apply -f https://github.com/grafana/k6-operator/releases/latest/download/k6-operator.yaml
```

#### Create k6 CRD

```yaml
# k6-test.yaml
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: k6-load-test
spec:
  parallelism: 4
  script:
    configMap:
      name: k6-test-script
      file: api_load_mainflow.ts
  arguments: --env ENV=sit
```

#### Run Test

```bash
# Create ConfigMap with test script
kubectl create configmap k6-test-script \
  --from-file=scripts/load/api_load_mainflow.ts

# Apply k6 test
kubectl apply -f k6-test.yaml

# Monitor progress
kubectl get k6
kubectl logs -f -l k6_cr=k6-load-test

# View results
kubectl logs k6-load-test-1-xxxxx
```

---

## Monitoring & Observability

### Grafana Dashboards

#### Access

```bash
# Local Docker setup
open http://localhost:3000

# Login credentials
Username: admin
Password: admin
```

#### Available Dashboards

1. **k6 Performance Overview**
   - Request rate (RPS)
   - Error rate
   - Response time percentiles (p50, p95, p99)
   - Active VUs

2. **Custom Metrics**
   - Login success rate
   - Checkout duration
   - Search performance

#### Key Panels

- **HTTP Request Duration**: Line graph showing p50/p95/p99 over time
- **Error Rate**: Gauge showing current error percentage
- **Request Rate**: Graph showing requests per second
- **Virtual Users**: Current active VUs

### Prometheus Queries

#### Useful Queries

```promql
# Request rate
rate(http_reqs_total[1m])

# Error rate
sum(rate(http_req_failed_total[1m])) / sum(rate(http_reqs_total[1m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_req_duration_bucket[1m])) by (le))

# P99 latency
histogram_quantile(0.99, sum(rate(http_req_duration_bucket[1m])) by (le))

# Requests by endpoint
sum(rate(http_reqs_total[1m])) by (endpoint)

# Errors by status code
sum(rate(http_req_failed_total[1m])) by (status)

# Custom: Login success rate
rate(login_success_total[1m]) / rate(login_total[1m])
```

### Accessing Metrics

```bash
# Prometheus UI
open http://localhost:9090

# Query metrics
# Navigate to Graph tab
# Enter PromQL query
# Click Execute
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Refused

**Symptom**: `dial tcp: connection refused`

**Solution**:

```bash
# Check if service is running
curl http://api-dev.example.com/health

# Verify BASE_URL in config
cat env/dev.json | grep baseUrl

# Check network connectivity
ping api-dev.example.com
```

#### 2. Authentication Failures

**Symptom**: `401 Unauthorized` errors

**Solution**:

```bash
# Verify credentials are set
echo $CLIENT_ID
echo $CLIENT_SECRET

# Check auth endpoint
curl -X POST https://auth-dev.example.com/oauth/token \
  -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"

# Review auth logs
k6 run --env DEBUG=true scripts/smoke/api_smoke.ts
```

#### 3. High Error Rates

**Symptom**: Error rate > 2%

**Investigation**:

```bash
# Check detailed errors
k6 run --http-debug scripts/load/api_load_mainflow.ts 2>&1 | grep "error"

# Review response status codes
grep "status" results/test-results.json | sort | uniq -c

# Check server logs
kubectl logs -f deployment/api-service

# Reduce load and retry
k6 run --env VUS=5 --env DURATION=2m scripts/load/api_load_mainflow.ts
```

#### 4. Slow Response Times

**Symptom**: p95 > 1500ms

**Investigation**:

```bash
# Check infrastructure metrics
# - CPU utilization
# - Memory usage
# - Database connections

# Test individual endpoints
k6 run --iterations 10 --vus 1 scripts/smoke/api_smoke.ts

# Review Grafana for bottlenecks
# Check if specific endpoints are slow
```

#### 5. Threshold Failures

**Symptom**: `thresholds on metrics 'http_req_duration' have been crossed`

**Solution**:

```bash
# Review threshold configuration
grep "thresholds" scripts/load/api_load_mainflow.ts

# Adjust thresholds if needed (only if justified)
# Or investigate root cause of performance issue

# Run with relaxed thresholds for debugging
k6 run --no-thresholds scripts/load/api_load_mainflow.ts
```

### Debug Mode

```bash
# Enable verbose logging
k6 run --verbose scripts/smoke/api_smoke.ts

# HTTP request/response debugging
k6 run --http-debug scripts/smoke/api_smoke.ts

# Full HTTP debug (very verbose)
k6 run --http-debug="full" scripts/smoke/api_smoke.ts

# Set debug in config
k6 run --env DEBUG=true scripts/smoke/api_smoke.ts
```

---

## Common Tasks

### Adding a New Test

```bash
# 1. Create test script
cp scripts/load/api_load_mainflow.ts scripts/load/my_new_test.ts

# 2. Edit test script
vi scripts/load/my_new_test.ts

# 3. Run locally
k6 run scripts/load/my_new_test.ts

# 4. Add to CI/CD
# Update .github/workflows/performance-tests.yml or ci/Jenkinsfile
```

### Adding Test Data

```bash
# 1. Create CSV file
echo "username,password" > data/new_users.csv
echo "user1,pass1" >> data/new_users.csv

# 2. Update environment config
vi env/dev.json
# Add: "newUsersFile": "data/new_users.csv"

# 3. Load in test script
const users = new SharedArray('users', () => {
  return open('../data/new_users.csv');
});
```

### Updating Thresholds

```bash
# 1. Edit threshold configuration
vi scripts/load/api_load_mainflow.ts

# 2. Update thresholds section
thresholds: {
  http_req_duration: ['p(95)<500'],  // Changed from 800ms to 500ms
},

# 3. Test locally
k6 run scripts/load/api_load_mainflow.ts

# 4. Commit and push
git add scripts/load/api_load_mainflow.ts
git commit -m "Update response time threshold to 500ms"
git push
```

### Generating Reports

```bash
# 1. Run test with JSON output
k6 run --out json=results/test.json scripts/load/api_load_mainflow.ts

# 2. Analyze with jq
cat results/test.json | jq '.metrics.http_req_duration'

# 3. Generate HTML report (custom script)
node tools/generate-report.js results/test.json > reports/test-report.html

# 4. Open report
open reports/test-report.html
```

### Cleaning Up

```bash
# Remove old results
rm -rf results/*.json

# Remove old reports
rm -rf reports/*.html

# Clean Docker volumes
docker-compose -f tools/docker-compose.yml down -v

# Reset test environment
# (Run environment-specific cleanup scripts)
```

---

## Quick Reference

### Essential Commands

```bash
# Local smoke test
k6 run scripts/smoke/api_smoke.ts

# Docker stack up
docker-compose -f tools/docker-compose.yml up -d

# View Grafana
open http://localhost:3000

# Stop Docker stack
docker-compose -f tools/docker-compose.yml down

# Run with overrides
k6 run --env ENV=sit --env VUS=50 scripts/load/api_load_mainflow.ts
```

### File Locations

- **Tests**: `scripts/<type>/*.ts`
- **Configs**: `env/<env>.json`
- **Results**: `results/`
- **Dashboards**: `tools/grafana/dashboards/`
- **CI/CD**: `.github/workflows/` or `ci/`

---

**Document Owner**: Performance Engineering Team  
**Last Updated**: 2025-01-18
