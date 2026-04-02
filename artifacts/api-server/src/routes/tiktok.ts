import { Router, type IRouter } from "express";
import { connect, disconnect, getStatus } from "../lib/tiktok-bridge.js";

const router: IRouter = Router();

router.post("/tiktok/connect", async (req, res): Promise<void> => {
  const { uniqueId } = req.body as { uniqueId?: string };

  if (!uniqueId || typeof uniqueId !== "string") {
    res.status(400).json({ error: "uniqueId is required" });
    return;
  }

  const result = await connect(uniqueId.trim());
  if (result.success) {
    res.json({ ok: true, uniqueId: uniqueId.trim() });
  } else {
    res.status(500).json({ error: result.error ?? "Connection failed" });
  }
});

router.post("/tiktok/disconnect", async (_req, res): Promise<void> => {
  await disconnect();
  res.json({ ok: true });
});

router.get("/tiktok/status", (_req, res): void => {
  res.json(getStatus());
});

export default router;
