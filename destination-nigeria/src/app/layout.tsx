import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bodoni-moda/opsz.css";
import "@fontsource-variable/bodoni-moda/opsz-italic.css";
import "@fontsource-variable/instrument-sans/wdth.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { ConsentManager } from "@/components/Consent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { RevealObserver } from "@/components/RevealObserver";
import { SoundProvider } from "@/components/sound";
import { site, siteUrl } from "@/content/site";
import { organizationLd, websiteLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: siteUrl() },
  openGraph: { type: "website", siteName: site.name, locale: site.locale, url: siteUrl(), title: site.title, description: site.description },
  twitter: { card: "summary_large_image" },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#103428",
  colorScheme: "light",
};

/**
 * `js` is set before paint so reveal animations start hidden only when
 * scripts run. A safety timer reveals the hero if the app bundle never loads.
 */
const bootScript = `document.documentElement.classList.add('js');setTimeout(function(){var h=document.querySelector('.hero');if(h&&!h.classList.contains('is-entered')&&!document.querySelector('dialog.welcome[open]'))h.classList.add('is-entered')},4000);`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <link rel="preload" href="/brand/destination-nigeria-logo-reverse.svg" as="image" type="image/svg+xml" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <SoundProvider>
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <ConsentManager />
        </SoundProvider>
        <RevealObserver />
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
