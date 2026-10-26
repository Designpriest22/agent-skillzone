import { PolicyPage, ToConfirm } from "@/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Terms of use", description: "Terms for using the Destination Nigeria website.", path: "/terms" });

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of use" path="/terms" updated="2026-10-26">
      <p>
        By using this website you agree to these terms. The site is operated by <ToConfirm>legal name of the operating organisation</ToConfirm>.
      </p>
      <h2>Information, not advice</h2>
      <p>
        Destination information is provided for inspiration and planning. We show sources and the date information was last checked, but conditions, access, prices and requirements change. Always confirm details with operators and read current official travel advice before you travel. We do not guarantee the safety of any destination.
      </p>
      <h2>Bookings</h2>
      <p>We do not sell travel or take payments. Bookings made through third-party links are contracts between you and the provider, under the provider&apos;s terms.</p>
      <h2>Investment information</h2>
      <p>Nothing on this site is an offer of securities, financial advice or a guarantee of returns. Published opportunities are summaries approved by the responsible authority; you should carry out your own due diligence.</p>
      <h2>Content and brand</h2>
      <p>
        The Destination Nigeria name, logo and site content belong to their owners. Map outlines are adapted from svg-maps by Michael Chukwu under CC BY 4.0. You may link to any page. Ask before reusing logos or images.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not misuse the forms, attempt to disrupt the service, or submit false information.</p>
      <h2>Governing law</h2>
      <p>
        These terms are governed by <ToConfirm>governing law and jurisdiction</ToConfirm>.
      </p>
    </PolicyPage>
  );
}
