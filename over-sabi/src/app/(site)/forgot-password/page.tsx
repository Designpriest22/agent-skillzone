import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/layout/AuthShell";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      aside="Enter your email and we'll send a link to choose a new password."
    >
      <ForgotForm />
    </AuthShell>
  );
}
