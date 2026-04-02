# Gumroad Listing Draft - Dungeon Mastering Lite

## Headline

Turn Twitch/YouTube chat into a live D&D-lite campaign with an AI Dungeon Master.

## Who this is for

- Streamers who want chat-driven roleplay chaos
- Creators who want interactive campaigns without building game systems from scratch
- Indie devs/community managers who want a flexible D&D-lite framework

## Features

- Real-time AI Dungeon Master narration (OpenAI-compatible)
- Chat command parsing for stream-driven actions and character creation
- Character system with races, classes, attributes, skills, progression
- Rules compendium with conditions and mechanics references
- Campaign save/load support
- TikTok-style command lookups and lightweight overlay flow
- TypeScript monorepo with setup scripts and buyer onboarding docs
- Project-local pnpm tooling (avoids global toolchain friction)

## Requirements

- Node.js 20+ (Node 24 recommended)
- PostgreSQL or Supabase/Postgres connection string
- OpenAI API key (or compatible endpoint)
- Windows/macOS/Linux terminal

## What you get

- Full source code
- Setup scripts (`setup.ps1`, `verify-env.ps1`, `.\pnpm.cmd`)
- Deployment notes and streamer setup guide
- Distribution build script (`build:dist`)
- License terms for personal/commercial streaming use

## Not included in purchase

- OpenAI API usage costs
- Database/hosting costs
- Managed hosting account for you

## Suggested price tiers

- Base License: $29
  - Full source package
  - Future bugfix updates for v1 line
- Premium Creator Pack: $39
  - Everything in Base
  - Priority setup support (single onboarding session)
  - Access to upcoming module drops (as announced)

## 20-30 second demo clip idea

Show: create character from chat -> AI DM response -> compendium lookup -> save campaign.

## Selling from your own website (still using Gumroad)

Gumroad can **host the downloadable zip** and run **checkout**. Your site is the **storefront**: marketing copy, screenshots, and a **Buy** button or link.

Typical flow:

1. Create the product on Gumroad and upload the zip you built with `pnpm run build:dist` (then zip `dist-package/` — see `scripts/zip-dist.ps1` on Windows).
2. On your website, add Gumroad’s **embed** or a normal link to the product URL. Customers pay on Gumroad (or in the embedded overlay) and get the download from Gumroad’s delivery email/page.
3. You are **not** required to host the binary on your own server unless you want to. “Direct download from my site” usually means “buyers discover and click Buy on my site”; Gumroad still delivers the file unless you switch to self-hosting.

Optional: Gumroad redirect after purchase back to a thank-you page on your domain.

## Optional anti-piracy starter (implemented)

With `NODE_ENV=production`, if `LICENSE_KEY` is not set in `.env`, the API logs an **UNLICENSED MODE** reminder at startup. It does not block the server. Omit `LICENSE_KEY` in local development as usual; set the key for licensed production installs when you distribute one.