/** WORKER_MODE=embedded runs the job worker inside the Next.js server (single-service deployments). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.WORKER_MODE === "embedded") {
    const { startWorker } = await import("./worker/loop");
    startWorker();
  }
}
