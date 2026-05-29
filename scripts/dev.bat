@echo off
echo 🚢 Starting Exopilot Monorepo (Next.js + Go)...

start cmd /k "echo Starting Go API Monolith... && cd apps/api && go run main.go"
start cmd /k "echo Starting Next.js Dev Server... && npm run dev --workspace=apps/web"

echo.
echo Both servers spawned in separate windows!
echo Go API running on http://localhost:8080
echo Next.js Web running on http://localhost:3000
echo.
pause
