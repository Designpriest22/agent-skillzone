import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "./env";
import { getCurrentUser, hasRole, type Role, type SessionUser } from "./auth/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/**
 * Wraps a route handler: converts HttpError / ZodError into JSON error responses and
 * never leaks stack traces.
 */
export function handler<A extends unknown[]>(fn: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Some details are missing or invalid.",
            code: "invalid_input",
            issues: err.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          { status: 400 },
        );
      }
      console.error("[api] unhandled error", err);
      return NextResponse.json(
        { error: "Something went wrong on our side. Try again.", code: "server_error" },
        { status: 500 },
      );
    }
  };
}

/**
 * CSRF defence for cookie-authenticated mutations: the browser's Origin header must
 * match our own origin. SameSite=Lax cookies are the first line; this is the second.
 */
export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const allowed = new Set([new URL(env().APP_URL).origin, new URL(req.url).origin]);
  if (!origin || !allowed.has(origin))
    throw new HttpError(403, "Request blocked: cross-site request.", "bad_origin");
}

export async function parseJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  assertSameOrigin(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.", "invalid_json");
  }
  return schema.parse(body);
}

export async function requireApiUser(minimum: Role = "learner"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.", "unauthenticated");
  if (!hasRole(user, minimum)) throw new HttpError(403, "You don't have access to this.", "forbidden");
  return user;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  );
}
