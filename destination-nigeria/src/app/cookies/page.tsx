import { CookiePreferences } from "@/components/CookiePreferences";
import { PolicyPage } from "@/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Cookies and storage", description: "What Destination Nigeria stores in your browser, and your analytics choices.", path: "/cookies" });

const rows = [
  { key: "dn:shortlist:v1", purpose: "Your trip shortlist and itinerary (stops, days, notes)", type: "Essential to the feature you use", lasts: "Until you clear it" },
  { key: "dn:sound", purpose: "Whether the welcome sound is on", type: "Preference", lasts: "Until you clear it" },
  { key: "dn:welcomed", purpose: "Whether you have seen the welcome screen", type: "Preference", lasts: "Until you clear it" },
  { key: "dn:consent", purpose: "Your analytics choice", type: "Essential (records consent)", lasts: "Until you clear it" },
];

export default function CookiesPage() {
  return (
    <PolicyPage title="Cookies and storage" path="/cookies" updated="2026-10-26">
      <p>This site does not set advertising or tracking cookies. It stores a few small items in your browser&apos;s local storage so features work as you expect. Nothing in this list is sent to us.</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.925rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line)" }}>
              <th scope="col" style={{ padding: "0.5rem" }}>
                Name
              </th>
              <th scope="col" style={{ padding: "0.5rem" }}>
                Purpose
              </th>
              <th scope="col" style={{ padding: "0.5rem" }}>
                Type
              </th>
              <th scope="col" style={{ padding: "0.5rem" }}>
                Lasts
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "0.5rem" }}>
                  <code>{r.key}</code>
                </td>
                <td style={{ padding: "0.5rem" }}>{r.purpose}</td>
                <td style={{ padding: "0.5rem" }}>{r.type}</td>
                <td style={{ padding: "0.5rem" }}>{r.lasts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Analytics</h2>
      <CookiePreferences />
    </PolicyPage>
  );
}
