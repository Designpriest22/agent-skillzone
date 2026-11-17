import { httpJson } from "./http";
import { requireCredentials } from "./registry";

/** Image generation via OpenAI Images API. Returns base64 PNG data or a URL. */
export async function generateImage(opts: { prompt: string; size: "1024x1024" | "1024x1536" | "1536x1024" }) {
  const c = await requireCredentials("openai_images");
  const res = await httpJson<{ data: { b64_json?: string; url?: string }[] }>("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: c.model || "gpt-image-1", prompt: opts.prompt, size: opts.size, n: 1 }),
    timeoutMs: 120_000,
  });
  const d = res.data[0];
  return d.url ? { url: d.url } : { dataUrl: `data:image/png;base64,${d.b64_json}` };
}

/** Generic video-generation adapter. See docs/INTEGRATIONS.md for mapping a specific provider. */
export async function generateVideo(opts: { prompt: string; aspectRatio: string; durationSeconds: number; imageUrl?: string }) {
  const c = await requireCredentials("video_provider");
  const res = await httpJson<{ id?: string; url?: string; status?: string }>(c.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: opts.prompt, aspect_ratio: opts.aspectRatio, duration_seconds: opts.durationSeconds, image_url: opts.imageUrl }),
    timeoutMs: 120_000,
  });
  return { jobId: res.id ?? null, url: res.url ?? null, status: res.status ?? (res.url ? "completed" : "submitted") };
}

export async function triggerVercelDeploy() {
  const c = await requireCredentials("vercel");
  return httpJson<{ job?: { id: string; state: string } }>(c.deployHookUrl, { method: "POST" });
}

/** Commits a single file to GitHub using the contents API. */
export async function commitFileToGitHub(opts: { path: string; content: string; message: string }) {
  const c = await requireCredentials("github");
  const branch = c.branch || "main";
  const base = `https://api.github.com/repos/${c.repo}/contents/${opts.path.replace(/^\/+/, "")}`;
  const headers = { Authorization: `Bearer ${c.token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
  let sha: string | undefined;
  try {
    const existing = await httpJson<{ sha: string }>(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
    sha = existing.sha;
  } catch { /* new file */ }
  const res = await httpJson<{ commit: { sha: string; html_url: string } }>(base, {
    method: "PUT", headers,
    body: JSON.stringify({ message: opts.message, content: Buffer.from(opts.content).toString("base64"), branch, sha }),
  });
  return { commitSha: res.commit.sha, url: res.commit.html_url };
}
