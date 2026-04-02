# D&D Adventure Bot – Deployment Guide

This guide covers deploying the D&D Adventure Bot to various platforms. The app consists of:

1. **API server** (Express) – handles game logic, AI DM, TikTok bridge
2. **Frontend** (React/Vite) – static build served with the API or a CDN
3. **PostgreSQL** – required for game state, characters, campaigns

## Prerequisites

- PostgreSQL database (self-hosted or managed: Railway, Supabase, Neon, etc.)
- OpenAI API key
- Environment variables configured (see `.env.example`)

---

## Option 1: Replit

1. **Import** the project into Replit (GitHub or zip upload).
2. **Secrets** – Add `DATABASE_URL` in Replit Secrets. Replit AI Integrations will auto-provision `AI_INTEGRATIONS_OPENAI_*`.
3. **Database** – Use Replit’s PostgreSQL or connect an external DB.
4. **Run** – Replit will detect the monorepo and run the configured artifacts (`api-server`, `dnd-adventure`, `mockup-sandbox`).
5. **Deploy** – Use Replit Deploy to publish.

---

## Option 2: Render (Full-Stack)

1. **Create a Web Service** for the API:
   - Build: `pnpm install && pnpm run build`
   - Start: `node artifacts/api-server/dist/index.cjs`
   - Add env: `DATABASE_URL`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

2. **Create a PostgreSQL** database on Render and connect it to the Web Service.

3. **Serve the frontend** from the API:
   - Build the frontend: `pnpm --filter @workspace/dnd-adventure run build`
   - Copy `artifacts/dnd-adventure/dist/public/*` into a `public` folder that Express serves.
   - Or configure the API to serve static files from `artifacts/dnd-adventure/dist/public`.

4. **Run DB migrations** as a pre-start step or a separate job:
   ```bash
   pnpm --filter @workspace/db run push
   ```

---

## Option 3: Railway

1. **New Project** → Deploy from GitHub or upload.
2. **Add PostgreSQL** – Railway can provision one.
3. **Configure service**:
   - Build: `pnpm install && pnpm run build`
   - Start: `node artifacts/api-server/dist/index.cjs`
   - Root directory: project root
4. **Variables** – Add `DATABASE_URL` (from Railway Postgres), `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`.
5. **Static frontend** – Either serve from the API (add static middleware) or deploy the frontend as a separate static site.

---

## Option 4: Vercel (Frontend) + Railway/Render (API + DB)

1. **API + DB** – Deploy the API and PostgreSQL on Railway or Render as above.
2. **Frontend on Vercel**:
   - Project: `artifacts/dnd-adventure`
   - Build: `pnpm install && pnpm run build`
   - Output: `dist/public` (or adjust `vite.config` output dir)
   - Env: `VITE_API_URL` (or equivalent) pointing to your API URL
3. **CORS** – Ensure the API allows the Vercel frontend origin.

---

## Option 5: Docker (Self-Hosted)

Example `Dockerfile` for the API (run frontend build and serve via API or nginx):

```dockerfile
FROM node:24-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/
RUN pnpm install --frozen-lockfile
RUN pnpm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "artifacts/api-server/dist/index.cjs"]
```

Build and run with `DATABASE_URL` and OpenAI env vars.

---

## Database Setup

Before first run, apply the schema:

```bash
pnpm --filter @workspace/db run push
```

This uses Drizzle’s `push` to sync the schema to your PostgreSQL database.

---

## Environment Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | `https://api.openai.com/v1` for OpenAI |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key |
| `PORT` | No | API port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `BASE_PATH` | No | Frontend base path (default: `/`) |
