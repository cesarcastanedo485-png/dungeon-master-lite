/**
 * CommonJS config at repo root so drizzle-kit does not load inside lib/db's
 * "type": "module" package (avoids "require is not defined in ES module scope").
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = __dirname;
for (const envPath of [path.join(root, ".env"), path.join(process.cwd(), ".env")]) {
  if (fs.existsSync(envPath)) {
    loadEnvFile(envPath);
    break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing. Fill .env before running db push.");
}

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: "./lib/db/src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
