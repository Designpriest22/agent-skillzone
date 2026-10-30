import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/layout/AuthShell";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  google_unconfigured: "Google sign-in isn't set up on this server. Use email and password instead.",
  google_state: "Google sign-in expired. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  unverified_email: "Your Google email address isn't verified.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(sp.next?.startsWith("/") ? sp.next : "/home");
  return (
    <AuthShell title="Sign in">
      <SignInForm
        next={sp.next}
        googleEnabled={!!env().GOOGLE_CLIENT_ID}
        error={sp.error ? (ERRORS[sp.error] ?? "Sign-in failed. Try again.") : undefined}
      />
    </AuthShell>
  );
}
