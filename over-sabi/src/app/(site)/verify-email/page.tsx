import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";
import { verifyEmail } from "@/lib/services/auth";

export const metadata: Metadata = { title: "Confirm your email" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = token ? await verifyEmail(token) : false;
  return (
    <AuthShell title={ok ? "Email confirmed" : "Link expired"}>
      {ok ? (
        <Notice tone="success" title="Thanks — your email is confirmed.">
          You can upgrade your plan and recover your account by email.
        </Notice>
      ) : (
        <Notice tone="warning" title="This link has expired or was already used.">
          Sign in and request a new confirmation link from Settings.
        </Notice>
      )}
      <ButtonLink href="/home" className="mt-6">
        Continue
      </ButtonLink>
    </AuthShell>
  );
}
