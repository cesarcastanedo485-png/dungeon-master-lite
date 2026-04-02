# D&D Adventure Bot

A chat-driven DnD-lite experience for streamers. Viewers use commands, the API processes game logic, and AI generates immersive Dungeon Master narration.

## Stack Reality Check

This workspace currently ships as a pnpm monorepo with a React/Vite frontend and an Express API (not Next.js).

## Buyer Onboarding Docs

- [SETUP-FOR-STREAMERS.md](SETUP-FOR-STREAMERS.md)
- [QUICK-START.md](QUICK-START.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)

## Setup (Windows)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

If setup fails at bootstrap, run only the bootstrap step:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-pnpm.ps1
```

Then run full setup again, or `.\pnpm.cmd install` manually.

Then:

1. Open `.env`
2. Fill `DATABASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`
3. Run:

```powershell
.\pnpm.cmd run db:push
.\pnpm.cmd run dev:api
.\pnpm.cmd run dev:web
```

## Build and Package (Gumroad, or Gumroad checkout linked from your site)

```powershell
.\pnpm.cmd run build
.\pnpm.cmd run build:dist
.\pnpm.cmd run zip:dist
```

`build:dist` creates `dist-package/` and excludes `.env`, caches, and git metadata. `zip:dist` writes `dungeon-mastering-lite-v1.zip` next to the repo for upload to Gumroad (or your host). See [GUMROAD-DRAFT.md](GUMROAD-DRAFT.md) for selling from your own site while using Gumroad delivery.

## Demo Asset Placeholders

- `assets/demo/01-dashboard-home.png`
- `assets/demo/02-character-creation.png`
- `assets/demo/03-chat-command-overlay.png`
- `assets/demo/04-compendium-search.png`
- `assets/demo/05-campaign-save-load.png`
- `assets/demo/demo-loop-20s.gif` (or `.mp4`)

## Gumroad Draft

See [GUMROAD-DRAFT.md](GUMROAD-DRAFT.md).

## Licensing

- [LICENSE](LICENSE)
- [LICENSE.md](LICENSE.md)
- [EULA-SNIPPET.txt](EULA-SNIPPET.txt)