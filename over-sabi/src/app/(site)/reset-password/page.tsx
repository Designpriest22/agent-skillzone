import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/layout/AuthShell";
import { Notice } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Notice tone="warning" title="This link is incomplete">
          Open the link from your email again, or <Link href="/forgot-password">request a new one</Link>.
        </Notice>
      )}
    </AuthShell>
  );
}
