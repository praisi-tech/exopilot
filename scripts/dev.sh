#!/bin/bash

echo "🚢 Starting Exopilot Monorepo (Next.js + Go)..."

# Exit handler
trap "kill 0" EXIT

# 1. Start Go API
cd apps/api && go run main.go &

# 2. Start Next.js Dev
cd ../.. && npm run dev --workspace=apps/web &

# Wait for both background jobs
wait
