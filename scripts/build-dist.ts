/**
 * Prepares a distribution package for sale (Gumroad, etc.).
 * Runs build, then copies project files to dist-package/ excluding
 * .cache, node_modules, .env, and dist directories.
 *
 * Usage: .\pnpm.cmd run build:dist
 */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "dist-package");

const EXCLUDE = new Set([
  ".cache",
  "node_modules",
  ".env",
  "dist",
  "dist-package",
  ".git",
  "dnd-adventure-export.tar.gz",
]);

const KEEP_DOTFILES = new Set([".replit", ".replitignore", ".gitignore", ".env.example", ".npmrc"]);

function shouldExclude(name: string): boolean {
  if (EXCLUDE.has(name)) return true;
  if (name.startsWith(".") && !KEEP_DOTFILES.has(name)) return true;
  return false;
}

function copyRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (shouldExclude(entry.name)) continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

async function main() {
  console.log("Running build...");
  const buildCmd =
    process.platform === "win32" ? ".\\pnpm.cmd run build" : "pnpm run build";
  execSync(buildCmd, { cwd: ROOT, stdio: "inherit" });

  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  console.log("Copying files to dist-package/...");
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (shouldExclude(entry.name)) continue;
    const srcPath = join(ROOT, entry.name);
    const destPath = join(OUT, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }

  console.log(`Done. Distribution package at: ${OUT}`);
  console.log("Zip with: cd dist-package && zip -r ../dnd-adventure-bot-v1.0.zip .");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
