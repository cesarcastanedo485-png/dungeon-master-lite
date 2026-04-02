const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (isDev) console.log(`[debug] ${msg}`, ...args);
  },
  info: (msg: string, ...args: unknown[]) => {
    if (isDev) console.log(`[info] ${msg}`, ...args);
  },
  /** Always logs (e.g. server startup) */
  startup: (msg: string) => {
    console.log(msg);
  },
  /** Always logs (e.g. license reminder in production) */
  warn: (msg: string) => {
    console.warn(`[warn] ${msg}`);
  },
  error: (msg: string, err?: unknown) => {
    console.error(`[error] ${msg}`, err ?? "");
  },
};
