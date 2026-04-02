# TROUBLESHOOTING

## pnpm not recognized / Local pnpm not found

Use project-local wrapper:

```powershell
.\pnpm.cmd --version
```

If missing, bootstrap pnpm first (fast, retriable):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-pnpm.ps1
```

Or run full setup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

If bootstrap fails, `.\pnpm.cmd` falls back to `npx pnpm` (may download on first run).

## Corepack EPERM in Program Files

Do not use `corepack prepare` for this repo. Use `.\scripts\setup.ps1` + `.\pnpm.cmd`.

## pnpm install “never finishes” / AI assistants keep retrying

Nothing is secretly broken most of the time: **this repo uses `node-linker=hoisted`**, so `pnpm install` **copies hundreds of packages** into a flat `node_modules`. On Windows that is often **10–20+ minutes** (longer with antivirus scanning every file). Progress may sit on `added N` for a long time while files copy.

**Do this:**

1. Run **`.\pnpm.cmd install`** in your own terminal (not “bare” `pnpm` unless it is on your PATH).
2. **Do not cancel** until the command returns to a prompt.
3. Optional: add **Windows Defender exclusions** for the project folder and **`.\pnpm-store`** so copies are not scanned one-by-one.
4. Quick health check after install: **`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1`**
5. Frontend-only build check: **`.\pnpm.cmd --filter @workspace/dnd-adventure run build`**

**Cursor / AI note:** automated runs often **time out or get stopped** before install finishes, which leaves a **half-populated `node_modules`** and confusing follow-up errors. Let the install complete once locally; after that, builds are usually **under a minute**.

## ERR_PNPM_EISDIR (symlink error on Windows)

If install fails with `EISDIR: illegal operation on a directory, symlink ... cross-spawn`, the project already uses `node-linker=hoisted` in `.npmrc` to avoid this. If you see it:

1. Remove `node_modules` and `.pnpm-store`
2. Run `.\pnpm.cmd install` again
3. Let it run to completion (can take 3–5 minutes)

## Setup failure diagnostics

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1
```

Check: `logs/setup-last.log`.

## `.env` placeholder warning

If verify says placeholders remain, edit `.env` and replace `PASTE_YOUR_...` values.

## DB push fails

- Confirm `DATABASE_URL` is valid in `.env`
- Confirm DB is reachable from your machine
- Ensure install finished: `.\pnpm.cmd install` (wait for completion, can take 3-5 min)
- If you see `@esbuild/win32-x64 could not be found`: the workspace excludes platform binaries for Replit. We keep win32 for local dev. Run `.\pnpm.cmd install` to refresh deps after pulling.
- Retry: `.\pnpm.cmd run db:push`

## API starts but frontend cannot fetch

- Ensure API terminal is running
- Check `http://localhost:3000/api/healthz`
- Restart both terminals
