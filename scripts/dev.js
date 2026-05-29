const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🚀 Starting Exopilot Monorepo (Next.js + Go)...");

// Load root .env file
const envConfig = {};
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  console.log("📝 Loading environment variables from root .env...");
  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const eqIdx = trimmed.indexOf("=");
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]+|['"]+$/g, "").trim();
      envConfig[key] = val;
    }
  });
}

// 1. Start Go API
const apiProcess = spawn("go", ["run", "."], {
  cwd: path.join(__dirname, "../apps/api"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ...envConfig },
});

apiProcess.on("error", (err) => {
  console.error("Failed to start Go API:", err);
});

// 2. Start Next.js Frontend (bind to all interfaces for LAN access)
const webProcess = spawn("npx", ["next", "dev", "-H", "0.0.0.0"], {
  cwd: path.join(__dirname, "../apps/web"),
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ...envConfig },
});

webProcess.on("error", (err) => {
  console.error("Failed to start Next.js Dev Server:", err);
});

// Handle termination
process.on("SIGINT", () => {
  console.log("\nStopping all processes...");
  apiProcess.kill();
  webProcess.kill();
  process.exit();
});

