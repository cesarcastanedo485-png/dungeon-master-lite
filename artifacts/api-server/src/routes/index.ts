import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import gameRouter from "./game.js";
import charactersRouter from "./characters.js";
import campaignsRouter from "./campaigns.js";
import tiktokRouter from "./tiktok.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gameRouter);
router.use(charactersRouter);
router.use(campaignsRouter);
router.use(tiktokRouter);

export default router;
