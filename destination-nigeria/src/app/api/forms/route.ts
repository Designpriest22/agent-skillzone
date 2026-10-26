import { NextResponse } from "next/server";
import { deliver } from "@/lib/delivery";
import { fieldErrors, formSchema, guardSchema, MIN_FILL_MS } from "@/lib/forms";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter(5, 10 * 60 * 1000);

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, code: "bad_request", message: "Send the form as JSON." }, { status: 415 });
  }
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ ok: false, code: "forbidden", message: "Cross-site submissions are not accepted." }, { status: 403 });
  }

  const rl = limiter.check(clientKey(req));
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", message: `Too many submissions from this connection. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.` },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 20_000) throw new Error("too large");
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request", message: "The form could not be read. Refresh the page and try again." }, { status: 400 });
  }

  const guard = guardSchema.safeParse(body);
  // Spam heuristics: a filled honeypot or an implausibly fast fill. Respond as if
  // accepted (so bots learn nothing) but deliver nothing.
  if (!guard.success || guard.data.company_url || Date.now() - guard.data.started < MIN_FILL_MS) {
    return NextResponse.json({ ok: true, code: "accepted" }, { status: 202 });
  }

  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "invalid", message: "Some fields need attention.", errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const result = await deliver(parsed.data);
  if (result.configured.length === 0) {
    return NextResponse.json(
      { ok: false, code: "not_configured", message: "Online submissions are not switched on yet, so your details were not sent. Please try again later." },
      { status: 503 },
    );
  }
  if (result.delivered.length === 0) {
    return NextResponse.json(
      { ok: false, code: "delivery_failed", message: "We couldn't send your details just now. Nothing was saved. Please try again in a few minutes." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, code: "delivered" }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Use POST." }, { status: 405, headers: { allow: "POST" } });
}
