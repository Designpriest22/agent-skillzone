import { Badge, Card, PageHeader, Stat } from "@/components/ui/primitives";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const tone = (s: string) =>
  (["validated", "verified", "available", "active"].includes(s)
    ? "success"
    : ["experimental", "beta", "draft", "in_review", "recruiting"].includes(s)
      ? "warning"
      : "neutral") as "success" | "warning" | "neutral";

export default async function AdminOverview() {
  await requireAdminPage("reviewer");
  const quality = await db()`
    select l.code, l.name, l.catalogue_status, l.content_status, l.stt_status, l.tts_status, l.tutor_status, l.human_reviewer_status,
      (select count(*) from vocabulary v where v.language_code = l.code)::int as vocab_total,
      (select count(*) from vocabulary v where v.language_code = l.code and v.review_status = 'verified')::int as vocab_verified,
      (select count(*) from lessons le join chapters ch on ch.id = le.chapter_id join courses c on c.id = ch.course_id where c.language_code = l.code and le.status = 'published')::int as lessons,
      (select count(*) from lessons le join chapters ch on ch.id = le.chapter_id join courses c on c.id = ch.course_id where c.language_code = l.code and le.status = 'published' and le.review_status = 'verified')::int as lessons_verified,
      (select count(*) from audio_assets a where a.language_code = l.code and a.review_status = 'verified')::int as audio_verified,
      (select count(*) from content_reports r where r.language_code = l.code and r.status = 'open')::int as open_reports,
      (select count(*) from provider_events p where p.language_code = l.code and p.created_at > now() - interval '7 days')::int as provider_calls,
      (select count(*) from provider_events p where p.language_code = l.code and not p.ok and p.created_at > now() - interval '7 days')::int as provider_failures
    from languages l where l.catalogue_status <> 'roadmap' order by l.sort_order`;
  const [funnel] = await db()`
    select
      (select count(*) from users)::int as users,
      (select count(*) from analytics_events where name = 'onboarding_completed' and created_at > now() - interval '30 days')::int as onboarded,
      (select count(*) from analytics_events where name = 'first_lesson_completed' and created_at > now() - interval '30 days')::int as first_lesson,
      (select count(*) from analytics_events where name = 'first_speaking_session' and created_at > now() - interval '30 days')::int as first_speaking,
      (select count(distinct user_id) from xp_events where created_at > now() - interval '7 days')::int as wau,
      (select count(*) from analytics_events where name = 'lesson_completed' and created_at > now() - interval '7 days')::int as lessons_7d,
      (select count(*) from analytics_events where name = 'speaking_session_started' and created_at > now() - interval '7 days')::int as sessions_started_7d,
      (select count(*) from analytics_events where name = 'speaking_session_completed' and created_at > now() - interval '7 days')::int as sessions_completed_7d,
      (select count(*) from analytics_events where name = 'guest_lesson_completed' and created_at > now() - interval '30 days')::int as guest_lessons,
      (select count(*) from analytics_events where name = 'checkout_started' and created_at > now() - interval '30 days')::int as checkouts,
      (select count(*) from analytics_events where name = 'subscription_activated' and created_at > now() - interval '30 days')::int as activations,
      (select count(*) from analytics_events where name = 'translation_reported' and created_at > now() - interval '30 days')::int as reports_30d,
      (select count(*) filter (where repetitions >= 2)::float / nullif(count(*) filter (where last_reviewed_at is not null), 0) from user_vocabulary) as retention,
      (select coalesce(sum(cost_estimate_usd), 0) from provider_events where created_at > now() - interval '30 days')::float as cost_30d`;
  const f = funnel!;
  const providers = await db()`
    select provider, capability, count(*)::int as calls, count(*) filter (where not ok)::int as failures,
      round(avg(latency_ms))::int as avg_ms
    from provider_events where created_at > now() - interval '7 days' group by 1, 2 order by 1, 2`;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Admin" title="Quality & analytics">
        Language readiness first; engagement separately from evidence of learning.
      </PageHeader>
      <section>
        <h2 className="mb-3 text-xl font-bold">Language quality</h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-mono text-xs uppercase">
              <tr>
                {[
                  "Language",
                  "Catalogue",
                  "Content",
                  "Vocab verified",
                  "Lessons verified",
                  "Native audio",
                  "Tutor",
                  "STT",
                  "TTS",
                  "Reviewers",
                  "Open reports",
                  "Provider fail % (7d)",
                ].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quality.map((q) => (
                <tr key={q.code}>
                  <td className="p-3 font-semibold">{q.name}</td>
                  <td className="p-3">
                    <Badge tone={tone(q.catalogue_status)}>{q.catalogue_status}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge tone={tone(q.content_status)}>{q.content_status}</Badge>
                  </td>
                  <td className="p-3">
                    {q.vocab_verified} / {q.vocab_total}
                  </td>
                  <td className="p-3">
                    {q.lessons_verified} / {q.lessons}
                  </td>
                  <td className="p-3">{q.audio_verified}</td>
                  <td className="p-3">
                    <Badge tone={tone(q.tutor_status)}>{q.tutor_status}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge tone={tone(q.stt_status)}>{q.stt_status}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge tone={tone(q.tts_status)}>{q.tts_status}</Badge>
                  </td>
                  <td className="p-3">{q.human_reviewer_status}</td>
                  <td className="p-3">{q.open_reports}</td>
                  <td className="p-3">
                    {q.provider_calls
                      ? `${Math.round((q.provider_failures / q.provider_calls) * 100)}% of ${q.provider_calls}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Engagement (30 days unless noted)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Accounts" value={f.users} />
          <Stat label="Weekly active learners" value={f.wau} hint="earned XP in last 7 days" />
          <Stat label="Onboarding completed" value={f.onboarded} />
          <Stat label="First lesson completed" value={f.first_lesson} />
          <Stat label="Guest lessons" value={f.guest_lessons} />
          <Stat label="First speaking session" value={f.first_speaking} />
          <Stat label="Lessons (7d)" value={f.lessons_7d} />
          <Stat
            label="Sessions done / started (7d)"
            value={`${f.sessions_completed_7d}/${f.sessions_started_7d}`}
          />
          <Stat label="Checkout → activated" value={`${f.activations}/${f.checkouts}`} />
          <Stat label="Translation reports" value={f.reports_30d} />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Evidence of learning</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Revision retention"
            value={f.retention == null ? "—" : `${Math.round(Number(f.retention) * 100)}%`}
            hint="reviewed cards recalled in 2+ consecutive reviews"
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          Retention is the closest signal to actual learning we have today. Time-in-app is deliberately not
          tracked as a goal.
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Providers (7 days)</h2>
        {providers.length ? (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 font-mono text-xs uppercase">
                <tr>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Capability</th>
                  <th className="p-3">Calls</th>
                  <th className="p-3">Failures</th>
                  <th className="p-3">Avg latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providers.map((p, i) => (
                  <tr key={i}>
                    <td className="p-3">{p.provider}</td>
                    <td className="p-3">{p.capability}</td>
                    <td className="p-3">{p.calls}</td>
                    <td className="p-3">{p.failures}</td>
                    <td className="p-3">{p.avg_ms ?? "—"} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <p className="text-sm text-muted">No provider calls recorded in the last 7 days.</p>
        )}
        <p className="mt-2 text-sm text-muted">
          Cost per session:{" "}
          {f.cost_30d
            ? `$${f.cost_30d.toFixed(2)} recorded in 30 days`
            : "not recorded — add cost estimates per provider call to enable"}
          .
        </p>
      </section>
    </div>
  );
}
