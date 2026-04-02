/**
 * Load monorepo root `.env` before any other imports read process.env.
 * Works from `src/` (tsx dev) and `dist/` (bundled production).
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}
