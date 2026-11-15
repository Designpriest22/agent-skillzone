import type { Metadata } from "next";
import { getCurrentUser, hasRole } from "@/lib/auth/session";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Player analytics · Run The Capital", robots: { index: false } };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!hasRole(user, "moderator")) {
    return (
      <main className="screen"><section className="panel center-panel"><h1>Staff only</h1><p>Sign in with a TCM moderator or admin account to view live player analytics.</p><a className="btn" href="/">Back to the game</a></section></main>
    );
  }
  return <main className="screen"><AdminDashboard /></main>;
}
