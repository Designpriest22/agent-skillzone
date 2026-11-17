import { redirect } from "next/navigation";
import { login, getUser } from "@/lib/auth";
import { inputClass, Field, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/client";

export const metadata = { title: "Sign in" };

async function signIn(formData: FormData) {
  "use server";
  const next = String(formData.get("next") || "/os");
  const res = await login(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!res.ok) redirect(`/login?error=${encodeURIComponent(res.error)}&next=${encodeURIComponent(next)}`);
  redirect(next.startsWith("/os") ? next : "/os");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  if (await getUser()) redirect("/os");
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[13px] font-bold text-accent-fg">P</span>
          <span className="font-semibold tracking-tight">Prohub OS</span>
        </div>
        <form action={signIn} className="space-y-3 rounded-lg border border-line bg-panel p-5">
          <h1 className="text-[16px] font-semibold">Sign in to the command centre</h1>
          {sp.error && <ErrorNote>{sp.error}</ErrorNote>}
          <input type="hidden" name="next" value={sp.next ?? "/os"} />
          <Field label="Email"><input name="email" type="email" autoComplete="email" required className={inputClass} /></Field>
          <Field label="Password"><input name="password" type="password" autoComplete="current-password" required className={inputClass} /></Field>
          <SubmitButton>Sign in</SubmitButton>
        </form>
      </div>
    </main>
  );
}
