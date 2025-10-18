# k6 Performance Test Framework - Reproducible Runner
# Based on official k6 image with pinned version for deterministic execution

# Use official k6 image (pinned version for reproducibility)
FROM grafana/k6:0.48.0

# Set working directory
WORKDIR /app

# Install xk6 extensions (optional - uncomment if needed)
# RUN apk add --no-cache git make && \
#     go install go.k6.io/xk6/cmd/xk6@latest && \
#     xk6 build --with github.com/grafana/xk6-output-prometheus-remote

# Copy framework files
COPY package.json ./
COPY tsconfig.json ./
COPY lib/ ./lib/
COPY scripts/ ./scripts/
COPY env/ ./env/
COPY data/ ./data/

# Set environment variables
ENV K6_OUT=json=/results/test-results.json
ENV K6_NO_USAGE_REPORT=true

# Create results directory
RUN mkdir -p /results

# Default command (can be overridden)
CMD ["run", "/scripts/smoke/api_smoke.ts"]

# Usage examples:
# docker build -t k6-perf-framework -f tools/Dockerfile .
# docker run --rm -v $(pwd)/results:/results k6-perf-framework
# docker run --rm -e ENV=sit k6-perf-framework run /scripts/load/api_load_mainflow.ts

