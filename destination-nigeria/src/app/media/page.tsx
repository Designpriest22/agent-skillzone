import Link from "next/link";
import { Eyebrow } from "@/components/brand";
import { PageHero } from "@/components/PageHero";
import { proposition } from "@/content/platform";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Media and press resources",
  description: "Press resources for Destination Nigeria: approved logo files, key messages, image permissions and media enquiries.",
  path: "/media",
});

export default function MediaPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Media & press", path: "/media" }]}
        eyebrow="Media & press"
        title="Press resources"
        lede="Key messages, brand assets and how to make a media enquiry. A full campaign and media toolkit, with verified information and image permissions, is in preparation."
      />
      <section className="section">
        <div className="container split">
          <div className="stack">
            <Eyebrow>Key message</Eyebrow>
            <h2 className="display t-2">{proposition.theme}</h2>
            <div className="prose">
              <p>{proposition.purpose}</p>
              <p>{proposition.honesty}</p>
            </div>
          </div>
          <div className="stack">
            <div className="panel stack">
              <h2 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                Logo files
              </h2>
              <p style={{ fontSize: "0.925rem" }}>Use the official artwork unaltered. Keep clear space around the mark and do not recolour, stretch or redraw it.</p>
              <div className="cluster">
                <a className="btn btn--forest btn--sm" href="/brand/destination-nigeria-logo.svg" download>
                  Logo, green (SVG)
                </a>
                <a className="btn btn--ghost btn--sm" href="/brand/destination-nigeria-logo-reverse.svg" download>
                  Logo, reverse (SVG)
                </a>
              </div>
            </div>
            <div className="panel stack">
              <h2 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                Images
              </h2>
              <p style={{ fontSize: "0.925rem" }}>
                Illustrations on this site are original artwork created for Destination Nigeria. Please make a media enquiry before reusing them. Licensed destination photography will be added to the toolkit together with its permissions.
              </p>
            </div>
            <div className="panel stack">
              <h2 className="t-3" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                Media enquiries
              </h2>
              <p style={{ fontSize: "0.925rem" }}>
                Use the <Link href="/partners?interest=media#enquiry">partnership form</Link> and choose “Media or content partnership”.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
