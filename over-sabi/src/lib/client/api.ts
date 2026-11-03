"use client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public issues?: { path: (string | number)[]; message: string }[],
  ) {
    super(message);
  }
}

/** JSON fetch for our own API. Throws ApiError with a learner-readable message. */
export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      headers:
        init.body !== undefined && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        init.body === undefined
          ? undefined
          : init.body instanceof FormData
            ? init.body
            : JSON.stringify(init.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("You seem to be offline. Check your connection and try again.", 0, "offline");
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; code?: string; issues?: ApiError["issues"] };
    const first = d.issues?.[0]?.message;
    throw new ApiError(
      first && d.code === "invalid_input" ? first : (d.error ?? "Something went wrong. Try again."),
      res.status,
      d.code ?? "error",
      d.issues,
    );
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
