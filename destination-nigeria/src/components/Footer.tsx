import Link from "next/link";
import { officialContact, socialLinks } from "@/content/platform";
import { footerNav, site } from "@/content/site";
import { RidgeMark } from "./brand";
import { CookieSettingsLink } from "./Consent";
import { NewsletterForm } from "./forms/NewsletterForm";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer on-dark">
      <div className="container">
        <div className="footer-top">
          <div className="stack-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/destination-nigeria-logo-reverse.svg" alt={site.name} width={220} height={86} style={{ width: "13.5rem" }} />
            <p className="muted" style={{ maxWidth: "26rem" }}>
              A national platform for tourism development, investment and destination marketing — connecting institutions, states, businesses, communities and travellers.
            </p>
            <div className="stack" style={{ maxWidth: "26rem" }}>
              <h2 className="eyebrow" id="footer-newsletter">
                Newsletter
              </h2>
              <NewsletterForm compact />
            </div>
          </div>
          <div className="footer-cols">
            <div>
              <h2>Explore</h2>
              <ul>
                {footerNav.explore.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Plan</h2>
              <ul>
                {footerNav.plan.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Work with us</h2>
              <ul>
                {footerNav.work.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Policies</h2>
              <ul>
                {footerNav.legal.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsLink />
                </li>
              </ul>
            </div>
            <div>
              <h2>Connect</h2>
              {socialLinks.length > 0 ? (
                <ul>
                  {socialLinks.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} rel="me noopener">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: "0.875rem" }}>
                  Official social channels will be listed here once confirmed.
                </p>
              )}
              {officialContact ? (
                <address style={{ fontStyle: "normal", marginTop: "1rem", fontSize: "0.875rem" }}>
                  {officialContact.email ? <a href={`mailto:${officialContact.email}`}>{officialContact.email}</a> : null}
                </address>
              ) : (
                <p className="muted" style={{ fontSize: "0.875rem", marginTop: "1rem" }}>
                  Enquiries: use the <Link href="/invest#enquiry">investment</Link> or <Link href="/partners#enquiry">partnership</Link> forms.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="footer-ridge" aria-hidden="true">
          <RidgeMark className="ridge-mark ridge-mark--wide" />
        </div>
        <div className="footer-bottom">
          <p>
            © {year} {site.name}. {site.tagline}
          </p>
          <p>
            Illustrations are original artwork, not photographs of the places named. Map outlines:{" "}
            <a href="https://github.com/VictorCazanave/svg-maps/tree/master/packages/nigeria">svg-maps / Michael Chukwu</a>, CC BY 4.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
