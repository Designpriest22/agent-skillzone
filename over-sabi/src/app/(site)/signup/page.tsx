import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/layout/AuthShell";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/home");
  return (
    <AuthShell
      title="Create your account"
      aside="Save your progress, keep a streak, and practise speaking with an AI tutor."
    >
      <SignUpForm googleEnabled={!!env().GOOGLE_CLIENT_ID} />
    </AuthShell>
  );
}
