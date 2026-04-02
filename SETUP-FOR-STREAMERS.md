# Setup For Streamers (Buyer Onboarding)

This guide is the fastest path from unzip to playable stream setup.

## 1) Unzip and open terminal

```powershell
cd "D:\path\to\dungeon-mastering-lite-v1"
```

## 2) Install project-local tooling and dependencies

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

If setup was already run once, you can use:

```powershell
.\pnpm.cmd install
```

## 3) Create `.env` from template

```powershell
.\pnpm.cmd run env:init
```

If local pnpm is not ready yet:

```powershell
node scripts/init-env.mjs
```

## 4) Fill your secrets in `.env`

Open `.env` and replace placeholders:

- `DATABASE_URL` = your Postgres/Supabase connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` = your OpenAI key
- keep `AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1`

## 5) Push database schema

```powershell
.\pnpm.cmd --filter @workspace/db run push
```

## 6) Start the app

Terminal A (API):

```powershell
.\pnpm.cmd --filter @workspace/api-server run dev
```

Terminal B (Frontend):

```powershell
.\pnpm.cmd --filter @workspace/dnd-adventure run dev
```

Open `http://localhost:5173`.

## 7) Stream command examples

- `!create elf wizard elowen`
- `!party`
- `!action I sneak toward the altar`
- `!sheet`
- `!cleric` (lookup popup)

## 8) Verify setup quickly

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1
```

Critical checks must pass before stream day.
