/**
 * Creates `.env` from `.env.example` if `.env` does not exist.
 * Then you only edit `.env` and paste your real DATABASE_URL and API keys.
 */
import { copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, ".env.example");
const env = join(root, ".env");

if (!existsSync(example)) {
  console.error("Missing .env.example in project root.");
  process.exit(1);
}

if (existsSync(env)) {
  console.log(".env already exists — open it and paste your keys where shown.");
  process.exit(0);
}

copyFileSync(example, env);
console.log("Created .env from .env.example");
console.log("Next: open .env in the project root and replace the placeholder values with your real DATABASE_URL and OpenAI key.");
