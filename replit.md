# Workspace

## Overview

pnpm workspace monorepo using TypeScript. D&D Adventure Bot — a text-based Dungeons & Dragons adventure game with an AI Dungeon Master, designed for TikTok Live stream control. Full-stack with React frontend and Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (no API key needed)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion

## Features

- **AI Dungeon Master**: GPT-5.2 powered DM streams narrative responses in real-time
- **AI DM Name Generation**: On game start, the AI generates a unique fantasy DM name (e.g. "Saelthar the Veilkeeper") that persists in the game state and appears throughout the UI
- **Parchment Instructions Panel**: On idle screen, a styled in-character scroll panel shows commands and rules — signed by the custom DM name
- **Save & Load Campaigns**: Full campaign snapshots (party, narrative, game state) can be saved by name and loaded at any time; auto-prompts to save on pause
- **Party Management**: Up to 4 active characters; admin can add/remove from web UI
- **Character Creation**: `!create [race] [class] [name]` creates pending characters. Character creation form auto-shows a conditional sub-choice dropdown based on race/class selection
- **Sub-Choice System**: Every race/class that implies a selection gets a mandatory specialization choice stored in DB and passed to the DM prompt: Dragonborn→Dragon Ancestry (fire/cold/lightning/acid/poison/thunder), Cleric→Divine Domain, Fighter→Fighting Style, Wizard→Arcane Tradition, Rogue→Roguish Archetype, Hunter→Favored Enemy
- **Game Control**: Start/Pause/Reset game flow with narrative persistence
- **TikTok Chat Lookup Popup**: `!Cleric`, `!Elf`, etc. triggers a rich overlay card (bottom-right, 10s timer) showing class/race info (icon, description, stats, traits, sub-choices, skill highlights). Broadcast via SSE to all connected clients.
- **TikTok Live Chat Bridge**: Connect to a TikTok Live stream via `tiktok-live-connector`. Chat commands (`!create`, `!action`, `!party`, `!sheet`, `!<class>`) are processed as game commands. DM responses stream via SSE to all clients. Dashboard sidebar panel shows connection status, username input, and live chat log.
- **SSE Broadcast Channel**: `GET /api/events` persistent SSE endpoint for real-time event broadcasting to all browser clients (also used for TikTok bridge events: `tiktok-chat`, `tiktok-status`, `navigate`, `narrative-update`, `narrative-done`)
- **Command System**: `!action`, `!sheet`, `!party`, `!create`, `!<class>`, `!<race>` commands
- **XP & Leveling**: Automatic XP parsing from DM responses, level thresholds
- **Compendium Tab**: Searchable glossary of 63 entries across 8 categories (Ability Types, Core Mechanics, Ability Scores, Conditions, Damage Types, Racial Sub-Choices, Game Terms, Commands) — accordion UI with live search
- **Tabs**: Adventure (dashboard), Characters, Classes, Races, Compendium

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/     # Express API server (game logic, DM API)
│   └── dnd-adventure/  # React + Vite frontend (D&D control panel)
├── lib/
│   ├── api-spec/       # OpenAPI spec + Orval codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/        # Generated Zod schemas from OpenAPI
│   ├── db/             # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/ # OpenAI server client
│   └── integrations-openai-ai-react/  # OpenAI React hooks
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **characters**: username, name, race, class, status (pending/active), level, xp, hp, stats, inventory, skills
- **game_state**: status (idle/active/paused), activeCharacterIds, storyContext, dmName
- **narrative**: type (dm/player/system), username, content, createdAt
- **campaigns**: name, dmName, gameStatus, storyContext, narrativeJson, charactersJson, savedAt
- **conversations** + **messages**: OpenAI conversation history

## API Endpoints

- `GET/POST /api/game/state|start|pause|reset` — game lifecycle
- `POST /api/game/generate-dm-name` — AI-generates a unique DM fantasy name, stores in game_state
- `GET /api/game/narrative` — story log
- `POST /api/game/action` — player action → SSE DM stream
- `POST /api/game/intro` — generate opening scene → SSE DM stream
- `GET/POST /api/characters` — list/create characters
- `POST /api/characters/:id/activate|deactivate` — party management
- `POST /api/characters/:id/award-xp` — manual XP award
- `DELETE /api/characters/:id` — remove character
- `GET /api/events` — SSE broadcast channel for real-time events
- `POST /api/game/lookup` — validate term and broadcast lookup event to all SSE clients
- `POST /api/tiktok/connect` — connect to TikTok Live stream by uniqueId
- `POST /api/tiktok/disconnect` — disconnect from TikTok Live
- `GET /api/tiktok/status` — get TikTok bridge connection status
- `GET/POST /api/campaigns` — list/save campaign snapshots
- `GET/DELETE /api/campaigns/:id` — get/delete specific campaign
- `POST /api/campaigns/:id/load` — restore full campaign (party + narrative + state)

## Valid Races & Classes

**Races**: tiefling, dragonborn, human, elf, halfling, gnome
**Classes**: wizard, cleric, fighter, rogue, hunter

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/dnd-adventure run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
