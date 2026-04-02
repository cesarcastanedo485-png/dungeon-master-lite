# QUICK START

## Local run (Windows)

1. `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
2. `notepad .env` and fill `DATABASE_URL` + OpenAI key
3. `.\pnpm.cmd --filter @workspace/db run push`
4. `.\pnpm.cmd --filter @workspace/api-server run dev`
5. `.\pnpm.cmd --filter @workspace/dnd-adventure run dev`
6. Open `http://localhost:5173`

## Build distributable folder

```powershell
.\pnpm.cmd run build:dist
```

Output is in `dist-package/`.
