import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { signInWithGoogle } from "@/lib/services/auth";

export async function GET(req: Request) {
  const e = env();
  const url = new URL(req.url);
  const jar = await cookies();
  const state = jar.get("os_oauth_state")?.value;
  const verifier = jar.get("os_oauth_verifier")?.value;
  jar.delete("os_oauth_state");
  jar.delete("os_oauth_verifier");
  const fail = (code: string) => NextResponse.redirect(new URL(`/signin?error=${code}`, e.APP_URL));
  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET) return fail("google_unconfigured");
  if (!state || !verifier || url.searchParams.get("state") !== state) return fail("google_state");
  const code = url.searchParams.get("code");
  if (!code) return fail("google_cancelled");
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: e.GOOGLE_CLIENT_ID,
        client_secret: e.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${e.APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) return fail("google_token");
    const { access_token } = (await tokenRes.json()) as { access_token: string };
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) return fail("google_profile");
    const info = (await infoRes.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
    };
    await signInWithGoogle({
      sub: info.sub,
      email: info.email.toLowerCase(),
      emailVerified: info.email_verified,
      name: info.name ?? "",
    });
    return NextResponse.redirect(new URL("/home", e.APP_URL));
  } catch (err) {
    return fail(err instanceof HttpError ? err.code : "google_failed");
  }
}
