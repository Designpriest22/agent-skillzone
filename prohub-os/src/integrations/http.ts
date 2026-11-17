/** Small fetch wrapper with timeout and readable errors for third-party APIs. */
export async function httpJson<T = unknown>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 30_000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
    if (!res.ok) {
      const detail = typeof body === "string" ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500);
      throw new Error(`${new URL(url).host} responded ${res.status}: ${detail}`);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}
