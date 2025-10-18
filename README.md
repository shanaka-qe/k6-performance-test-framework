# 🚀 k6 Performance Testing Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![k6](https://img.shields.io/badge/k6-v0.52.0-blue.svg)](https://k6.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **Enterprise-grade, code-first k6 performance testing framework** for API, microservices, and web applications. Built for senior performance engineers who value modularity, type safety, and CI/CD integration.

**Author:** Shanaka Fernando  
**LinkedIn:** https://www.linkedin.com/in/shanaka-qe/

---

## 🧠 About This Framework

This production-ready framework was originally built for a client engagement and has been battle-tested in real-world performance programs. I'm now sharing it with the community so other teams can adopt, extend, and tailor it for their own k6 workloads.

## 🏗️ Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           k6 Performance Testing Framework                    │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   Test Scripts  │    │   Core Library  │    │   Scenarios     │            │
│  │                 │    │                 │    │                 │            │
│  │ • Smoke Tests   │    │ • HTTP Client   │    │ • Login Flow    │            │
│  │ • Load Tests    │◄───┤ • Auth Manager  │◄───┤ • Checkout Flow │            │
│  │ • Stress Tests  │    │ • Environment   │    │ • Common Utils  │            │
│  │ • Soak Tests    │    │ • Metrics       │    │                 │            │
│  │ • Spike Tests   │    │ • Checks        │    │                 │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│           │                       │                       │                   │
│           └───────────────────────┼───────────────────────┘                   │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐  │
│  │                    Configuration Layer                                  │  │
│  │                                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │    Dev      │  │     SIT     │  │     UAT     │  │   Common    │     │  │
│  │  │   Config    │  │   Config    │  │   Config    │  │   Config    │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  │                                                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │              Environment Variables Override                     │    │  │
│  │  │        (BASE_URL, CLIENT_ID, VUS, DURATION, etc.)               │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐  │
│  │                    Execution Layer                                      │  │
│  │                                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   Local     │  │     CI      │  │  Kubernetes │  │    Cloud    │     │  │
│  │  │ Execution   │  │  Pipeline   │  │ k6-operator │  │   k6 Cloud  │     │  │
│  │  │             │  │             │  │             │  │             │     │  │
│  │  │ • npm run   │  │ • GitHub    │  │ • k8s YAML  │  │ • k6 Cloud  │     │  │
│  │  │ • Docker    │  │   Actions   │  │ • Helm      │  │ • Grafana   │     │  │
│  │  │ • Compose   │  │ • Jenkins   │  │ • Scaling   │  │   Cloud     │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                   │                                           │
│  ┌────────────────────────────────┼────────────────────────────────────────┐  │
│  │                    Observability Layer                                  │  │
│  │                                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │ Prometheus  │  │   Grafana   │  │  InfluxDB   │  │   Custom    │     │  │
│  │  │             │  │             │  │             │  │  Metrics    │     │  │
│  │  │ • Metrics   │  │ • Dashboards│  │ • Time      │  │ • Business  │     │  │
│  │  │ • Alerts    │  │ • Charts    │  │   Series    │  │   Logic     │     │  │
│  │  │ • SLOs      │  │ • Reports   │  │ • Storage   │  │   Tracking  │     │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        Quality Gates                                    │  │
│  │                                                                         │  │
│  │  • HTTP Error Rate < 2%     • Response Time P95 < 800ms                 │  │
│  │  • Check Success Rate > 95%  • Custom Business Logic Validation         │  │
│  │  • Threshold Failures → Build Failure                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘

Key Components:
├── Test Scripts: TypeScript-based test implementations
├── Core Library: Reusable utilities and abstractions  
├── Scenarios: Business logic and user journey modeling
├── Configuration: Environment-aware config management
├── Execution: Multiple deployment and scaling options
├── Observability: Comprehensive monitoring and alerting
└── Quality Gates: Automated SLO validation and reporting
```

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Test Types](#-test-types)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [CI/CD Integration](#-cicd-integration)
- [Observability](#-observability)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## ✨ Features

- **🎯 Code-First**: TypeScript-based tests with full type safety
- **🔧 Modular Architecture**: Reusable libraries and scenario composition
- **🌍 Environment-Aware**: JSON configs + env var overrides (dev/sit/uat)
- **📊 Built-in Observability**: Prometheus + Grafana dashboards included
- **🐳 Reproducible**: Docker-based execution with pinned dependencies
- **⚡ CI/CD Ready**: GitHub Actions & Jenkins pipelines included
- **📈 Threshold-Based**: Quality gates that fail builds on SLA breach
- **🔄 Realistic Traffic**: Arrival-rate executors and think-time modeling
- **📦 Scalable**: Local → CI → Kubernetes (k6-operator ready)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for linting and type checking)
- **k6** 0.48.0+ ([installation guide](https://k6.io/docs/get-started/installation/))
- **Docker** (optional, for local observability stack)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/k6-performance-test-framework.git
cd k6-performance-test-framework

# Install dependencies
npm install

# Run your first smoke test
npm run test:smoke

# Or use k6 directly
k6 run --env ENV=dev scripts/smoke/api_smoke.ts
```

### Docker Quick Start

```bash
# Start the observability stack (Prometheus + Grafana)
npm run docker:up

# Run tests in Docker
npm run docker:test

# Access Grafana dashboards
open http://localhost:3000  # admin/admin

# Stop the stack
npm run docker:down
```

---

## 📁 Project Structure

```
k6-performance-test-framework/
├── lib/                          # 🧰 Core framework libraries
│   ├── env.ts                    # Environment configuration loader
│   ├── httpClient.ts             # HTTP client with retries & defaults
│   ├── auth.ts                   # Authentication & token management
│   ├── checks.ts                 # Standardized validation functions
│   ├── metrics.ts                # Custom metrics & thresholds
│   └── utils.ts                  # Helper utilities (data generation, timing)
│
├── scripts/                      # 📝 Test scripts
│   ├── smoke/                    # Quick health checks
│   ├── load/                     # Baseline performance tests
│   ├── stress/                   # Capacity & breaking point tests
│   ├── soak/                     # Endurance tests (memory leaks)
│   ├── spike/                    # Burst traffic resilience tests
│   └── scenarios/                # Reusable scenario definitions
│       ├── common.ts             # Shared executors & thresholds
│       ├── login.ts              # Login flow
│       └── checkout.ts           # Checkout flow
│
├── env/                          # ⚙️ Environment configurations
│   ├── common.json               # Shared config across environments
│   ├── dev.json                  # Development environment
│   ├── sit.json                  # System Integration Test
│   └── uat.json                  # User Acceptance Test
│
├── data/                         # 📦 Test data
│   ├── users_dev.csv             # Test users (per environment)
│   └── payloads/                 # Request payload templates
│       ├── order_request.json
│       └── search_payload.json
│
├── tools/                        # 🐳 Docker & Observability
│   ├── Dockerfile                # k6 runner image
│   ├── docker-compose.yml        # Full stack (k6 + Prometheus + Grafana)
│   ├── prometheus/               # Prometheus configuration
│   └── grafana/                  # Grafana dashboards & provisioning
│
├── ci/                           # 🔄 CI/CD configurations
│   ├── Jenkinsfile               # Jenkins pipeline
│   └── qa-quality-gate.yml       # Quality gate definitions
│
├── .github/workflows/            # GitHub Actions workflows
│   └── performance-tests.yml
│
├── docs/                         # 📚 Documentation
│   ├── test-strategy.md
│   ├── modeling-and-scenarios.md
│   ├── runbook.md
│   ├── conventions.md
│   └── contributing.md
│
├── results/                      # 📊 Test results (gitignored)
└── reports/                      # 📄 HTML reports (gitignored)
```

---

## 🧪 Test Types

| Type       | Purpose                                | Duration  | Load Pattern            | Use Case                                         |
| ---------- | -------------------------------------- | --------- | ----------------------- | ------------------------------------------------ |
| **Smoke**  | Health check & quick validation        | 1-2 min   | Minimal (1-5 VUs)       | PR checks, deployment validation                 |
| **Load**   | Baseline performance & SLA validation  | 5-30 min  | Constant arrival rate   | Regular CI runs, SLA verification                |
| **Stress** | Find breaking points & capacity limits | 10-20 min | Ramping arrival rate    | Capacity planning, bottleneck identification     |
| **Soak**   | Detect memory leaks & degradation      | 2-8 hours | Sustained moderate load | Pre-release validation, stability testing        |
| **Spike**  | Test resilience under sudden bursts    | 5-10 min  | Rapid spikes            | Auto-scaling validation, circuit breaker testing |

---

## 💻 Usage

### Running Tests Locally

```bash
# Smoke test (quick health check)
npm run test:smoke

# Load test (baseline performance)
npm run test:load

# Stress test (find breaking points)
npm run test:stress

# Soak test (endurance)
npm run test:soak

# Spike test (burst resilience)
npm run test:spike
```

### Environment Selection

```bash
# Run against specific environment
k6 run --env ENV=sit scripts/load/api_load_mainflow.ts

# Override specific config values
k6 run \
  --env ENV=uat \
  --env BASE_URL=https://api-custom.example.com \
  --env VUS=50 \
  --env DURATION=15m \
  scripts/load/api_load_mainflow.ts
```

### Output Options

```bash
# JSON output for CI artifact
k6 run --out json=results/test-results.json scripts/smoke/api_smoke.ts

# Prometheus Remote Write (with xk6 extension)
k6 run --out experimental-prometheus-rw scripts/load/api_load_mainflow.ts

# InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 scripts/load/api_load_mainflow.ts

# k6 Cloud
k6 run --out cloud scripts/load/api_load_mainflow.ts
```

### Docker Usage

```bash
# Start full observability stack
docker-compose -f tools/docker-compose.yml up -d

# Run test in Docker
docker-compose -f tools/docker-compose.yml run --rm k6 run /scripts/load/api_load_mainflow.ts

# With environment override
docker-compose -f tools/docker-compose.yml run --rm -e ENV=sit k6 run /scripts/load/api_load_mainflow.ts

# Stop stack
docker-compose -f tools/docker-compose.yml down
```

---

## ⚙️ Configuration

### Environment Configuration

Configuration is loaded from JSON files in `/env` directory with the following precedence:

1. **common.json** - Base configuration shared across all environments
2. **{env}.json** - Environment-specific config (dev/sit/uat)
3. **Environment Variables** - Runtime overrides (highest precedence)

Example environment variable overrides:

```bash
export BASE_URL=https://api-custom.example.com
export CLIENT_ID=my-client-id
export CLIENT_SECRET=my-secret
export VUS=50
export DURATION=15m
export RPS=100
```

### Creating Custom Environments

```bash
# 1. Create new environment config
cp env/sit.json env/prod.json

# 2. Update configuration values
vi env/prod.json

# 3. Run tests against new environment
k6 run --env ENV=prod scripts/load/api_load_mainflow.ts
```

### Threshold Configuration

Thresholds are defined in test scripts and can be customized per environment. See [docs/test-strategy.md](docs/test-strategy.md) for details.

---

## 🔄 CI/CD Integration

### GitHub Actions

Automatically runs performance tests on:

- Pull requests (smoke tests)
- Merges to main (load tests)
- Scheduled runs (nightly stress/soak tests)

See [`.github/workflows/performance-tests.yml`](.github/workflows/performance-tests.yml)

### Jenkins

Parameterized pipeline supporting:

- Multiple test types
- Environment selection
- Custom VUs and duration
- Threshold enforcement

See [`ci/Jenkinsfile`](ci/Jenkinsfile)

### Required Secrets

Configure these secrets in your CI/CD platform:

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

---

## 📊 Observability

### Grafana Dashboards

Access pre-configured dashboards at `http://localhost:3000` (admin/admin):

- **k6 Performance Overview**: Request rates, error rates, latency percentiles
- **Custom Metrics**: Login success rate, checkout duration, search performance

### Prometheus Queries

Key metrics available in Prometheus:

```promql
# Request rate
rate(http_reqs_total[1m])

# Error rate
sum(rate(http_req_failed_total[1m])) / sum(rate(http_reqs_total[1m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_req_duration_bucket[1m])) by (le))

# Custom: Login success rate
rate(login_success_total[1m])
```

### Viewing Results

```bash
# Terminal output
k6 run scripts/smoke/api_smoke.ts

# JSON output
k6 run --out json=results/test.json scripts/smoke/api_smoke.ts
cat results/test.json | jq '.metrics'

# Grafana (with docker-compose stack)
open http://localhost:3000
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](docs/) directory:

- **[Test Strategy](docs/test-strategy.md)** - Performance requirements, SLAs, test approach
- **[Modeling & Scenarios](docs/modeling-and-scenarios.md)** - Executors, traffic patterns, data profiles
- **[Runbook](docs/runbook.md)** - Operational guide for running tests (local/CI/K8s)
- **[Conventions](docs/conventions.md)** - Code style, naming, PR guidelines
- **[Contributing](docs/contributing.md)** - How to contribute to the framework

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Make your changes
4. Run linting and type checks (`npm run lint && npm run type-check`)
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**SNK Media Pty Ltd** - Performance Engineering Team

---

## 🙏 Acknowledgments

- [k6](https://k6.io/) - Modern load testing tool
- [Grafana](https://grafana.com/) - Observability platform
- [Prometheus](https://prometheus.io/) - Monitoring system

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/k6-performance-test-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/k6-performance-test-framework/discussions)

---

**⚡ Built for performance excellence | 🎯 Production-ready | 🚀 CI/CD native**

© 2025 SNK Media Pty Ltd
