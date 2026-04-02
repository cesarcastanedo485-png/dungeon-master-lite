/**
 * Prepares a distribution package for sale (Gumroad, etc.).
 * Runs build, then copies project files to dist-package/ excluding
 * .cache, node_modules, .env, and dist directories.
 */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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

function shouldExclude(name) {
  if (EXCLUDE.has(name)) return true;
  if (name.startsWith(".") && !KEEP_DOTFILES.has(name)) return true;
  return false;
}

function copyRecursive(src, dest) {
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

function main() {
  console.log("Running build...");
  const buildCmd = process.platform === "win32" ? ".\\pnpm.cmd run build" : "pnpm run build";
  execSync(buildCmd, { cwd: ROOT, stdio: "inherit" });

  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
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
  console.log("Zip for Gumroad: pnpm run zip:dist   (or: cd dist-package && zip -r ../dungeon-mastering-lite-v1.zip .)");
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
