import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, hasRole, type Role, type SessionUser } from "./session";

/** For server components/pages: redirects to sign-in (or onboarding) when needed. */
export async function requirePageUser(
  opts: { next?: string; allowUnonboarded?: boolean; role?: Role } = {},
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ""}`);
  if (!opts.allowUnonboarded && !user.onboarded) redirect("/onboarding");
  if (opts.role && !hasRole(user, opts.role)) redirect("/home?denied=1");
  return user;
}
