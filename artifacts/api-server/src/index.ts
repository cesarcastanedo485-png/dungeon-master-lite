import "./load-env.js";
import app from "./app";
import { logger } from "./lib/logger.js";

const licenseKey = process.env["LICENSE_KEY"]?.trim();
if (process.env["NODE_ENV"] === "production" && !licenseKey) {
  logger.warn(
    'UNLICENSED MODE: LICENSE_KEY is not set. Add it to .env from your purchase email if you have a license.',
  );
}

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  logger.startup(`Server listening on port ${port}`);
});
