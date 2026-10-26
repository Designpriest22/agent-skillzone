import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const valid = {
  kind: "newsletter",
  email: "visitor@example.com",
  audience: "traveller",
  interests: ["ntw"],
  consent: true,
  company_url: "",
};

async function post(body: unknown, headers: Record<string, string> = {}) {
  const { POST } = await import("@/app/api/forms/route");
  const req = new Request("http://localhost/api/forms", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  return { status: res.status, json: (await res.json()) as { ok: boolean; code: string; errors?: Record<string, string> } };
}

describe("POST /api/forms", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.FORMS_WEBHOOK_URL;
    delete process.env.FORMS_FILE_STORE;
    delete process.env.RESEND_API_KEY;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("refuses to claim success when no delivery is configured", async () => {
    const r = await post({ ...valid, started: Date.now() - 10_000 });
    expect(r.status).toBe(503);
    expect(r.json.ok).toBe(false);
    expect(r.json.code).toBe("not_configured");
  });

  it("returns field errors for invalid input", async () => {
    process.env.FORMS_WEBHOOK_URL = "https://hooks.example.com/x";
    const r = await post({ ...valid, email: "nope", consent: false, started: Date.now() - 10_000 });
    expect(r.status).toBe(422);
    expect(Object.keys(r.json.errors ?? {})).toEqual(expect.arrayContaining(["email", "consent"]));
  });

  it("delivers to the configured webhook", async () => {
    process.env.FORMS_WEBHOOK_URL = "https://hooks.example.com/x";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await post({ ...valid, started: Date.now() - 10_000 });
    expect(r.status).toBe(200);
    expect(r.json.code).toBe("delivered");
    expect(fetchMock).toHaveBeenCalledOnce();
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.payload.email).toBe("visitor@example.com");
    expect(sent.payload).not.toHaveProperty("company_url");
  });

  it("reports failure honestly when delivery fails", async () => {
    process.env.FORMS_WEBHOOK_URL = "https://hooks.example.com/x";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await post({ ...valid, started: Date.now() - 10_000 });
    expect(r.status).toBe(502);
    expect(r.json.ok).toBe(false);
  });

  it("silently drops honeypot and too-fast submissions without delivering", async () => {
    process.env.FORMS_WEBHOOK_URL = "https://hooks.example.com/x";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await post({ ...valid, company_url: "http://spam", started: Date.now() - 10_000 })).json.code).toBe("accepted");
    expect((await post({ ...valid, started: Date.now() })).json.code).toBe("accepted");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin posts", async () => {
    const r = await post({ ...valid, started: Date.now() - 10_000 }, { origin: "https://evil.example" });
    expect(r.status).toBe(403);
  });

  it("rate-limits repeated submissions from one client", async () => {
    const ip = { "x-forwarded-for": "192.0.2.1" };
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await post({ ...valid, started: Date.now() - 10_000 }, ip)).status);
    expect(codes.at(-1)).toBe(429);
  });
});
