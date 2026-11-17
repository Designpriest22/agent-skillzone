/** Standalone worker process: `npm run worker`. Run alongside `npm start` in production. */
import { startWorker } from "./loop";
import { closeDb } from "@/db/client";

const stop = startWorker();

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, finishing in-flight jobs…`);
  await stop();
  await closeDb();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
