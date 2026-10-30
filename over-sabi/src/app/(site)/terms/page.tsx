import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui/primitives";
import { Prose } from "@/components/site/Prose";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <Notice tone="warning" title="Draft for legal review" className="mb-8">
        These terms reflect how the product works but have not been reviewed by a lawyer. Complete the
        bracketed details and obtain legal review before launch.
      </Notice>
      <Prose>
        <p>
          These terms are between you and [operator legal name] (&quot;Over Sabi&quot;). By creating an
          account you agree to them.
        </p>
        <h2>Accounts</h2>
        <p>
          You must be 13 or older. Keep your password safe; you&apos;re responsible for activity on your
          account.
        </p>
        <h2>Learning content and AI</h2>
        <ul>
          <li>Content is labelled with its review status. Beta and draft content may contain errors.</li>
          <li>
            AI tutors are AI-generated characters. Their replies, corrections and summaries are learning
            guidance, not an authoritative linguistic or cultural judgement.
          </li>
          <li>Courses don&apos;t lead to any formal qualification or certification.</li>
        </ul>
        <h2>Acceptable use</h2>
        <p>
          Don&apos;t use the service to harass anyone, submit content you don&apos;t have the right to share,
          try to access other people&apos;s data, or overload or reverse-engineer the service.
        </p>
        <h2>Contributions</h2>
        <p>
          When you submit words, corrections, notes or recordings, you confirm you have the right to share
          them and license them to Over Sabi under CC BY-SA 4.0. Recordings require your explicit consent as
          the speaker; you can ask us to remove them.
        </p>
        <h2>Paid plans</h2>
        <ul>
          <li>
            Paid plans renew automatically until cancelled. You keep access until the end of the paid period.
          </li>
          <li>Prices and currencies are shown at checkout. Payments are processed by Paystack.</li>
          <li>
            Refunds: [refund policy to be defined by the operator in line with applicable consumer protection
            law].
          </li>
        </ul>
        <h2>Availability</h2>
        <p>
          We work to keep Over Sabi available, but AI and speech features depend on third-party services and
          may be unavailable at times.
        </p>
        <h2>Liability</h2>
        <p>[Limitation of liability clause — to be drafted by counsel.]</p>
        <h2>Governing law</h2>
        <p>[Governing law and jurisdiction — to be confirmed by counsel.]</p>
      </Prose>
    </div>
  );
}
