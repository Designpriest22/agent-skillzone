import { AdminButton, AdminForm } from "@/components/admin/AdminControls";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage("admin");
  const q = (await searchParams).q?.trim();
  const users = q
    ? await db()`
        select u.id, u.email, u.display_name, u.role, u.email_verified_at, u.created_at, p.age_band,
          (select json_agg(json_build_object('plan', s.plan_code, 'provider', s.provider, 'status', s.status, 'until', s.current_period_end))
             from subscriptions s where s.user_id = u.id) as subs
        from users u left join profiles p on p.user_id = u.id
        where u.email ilike ${"%" + q + "%"} or u.display_name ilike ${"%" + q + "%"} order by u.created_at desc limit 25`
    : [];
  const plans = await db()`select code from plans order by sort_order`;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Accounts" title="Users">
        Search by email or name. Role changes and plan grants are audited. You can&apos;t see learners&apos;
        transcripts here — by design.
      </PageHeader>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="email or name"
          className="min-h-10 flex-1 rounded-lg border-2 border-border bg-surface px-3"
        />
        <button className="rounded-lg bg-primary px-4 text-on-primary">Search</button>
      </form>
      {q && !users.length ? <EmptyState title="No users match" /> : null}
      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-col gap-3">
            <p className="flex flex-wrap items-center gap-2">
              <strong>{u.email}</strong> {u.display_name} <Badge>{u.role}</Badge> <Badge>{u.age_band}</Badge>
              {u.email_verified_at ? (
                <Badge tone="success">verified</Badge>
              ) : (
                <Badge tone="warning">unverified</Badge>
              )}
            </p>
            <p className="text-xs text-muted">
              Joined {new Date(u.created_at).toLocaleDateString()} ·{" "}
              {(u.subs ?? [])
                .map(
                  (s: { plan: string; provider: string; status: string; until: string | null }) =>
                    `${s.plan} (${s.provider}, ${s.status}${s.until ? ` until ${new Date(s.until).toLocaleDateString()}` : ""})`,
                )
                .join(", ") || "free"}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminForm
                action="set_user_role"
                fixed={{ userId: u.id }}
                submitLabel="Change role"
                fields={[
                  {
                    name: "role",
                    label: "Role",
                    type: "select",
                    options: ["learner", "contributor", "reviewer", "editor", "admin"],
                    defaultValue: u.role,
                  },
                ]}
              />
              <AdminForm
                action="grant_plan"
                fixed={{ userId: u.id }}
                submitLabel="Grant plan"
                fields={[
                  {
                    name: "planCode",
                    label: "Plan",
                    type: "select",
                    options: plans.map((p) => p.code as string),
                    defaultValue: "plus",
                  },
                  { name: "days", label: "Days", type: "number", defaultValue: 30 },
                  { name: "reason", label: "Reason (audited)", defaultValue: "" },
                ]}
              />
            </div>
            <AdminButton
              action="revoke_manual_plans"
              input={{ userId: u.id }}
              label="Revoke manual grants"
              variant="ghost"
              confirm="Cancel all manually granted plans for this user?"
            />
          </Card>
        ))}
      </ul>
    </div>
  );
}
