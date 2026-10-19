import type { Metadata } from "next";
import { Notice, PageHeader } from "@/components/ui/primitives";
import { Prose } from "@/components/site/Prose";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <Notice tone="warning" title="Draft for legal review" className="mb-8">
        This policy describes how the software actually handles data. It was written with the Nigeria Data
        Protection Act 2023 (NDPA) in mind but has not yet been reviewed by a lawyer. The operator must
        complete the bracketed details and obtain legal review before launch.
      </Notice>
      <Prose>
        <p>
          Last updated: [date of publication]. Data controller: [operator legal name, address, contact email].
          Data protection officer: [name and contact, if appointed under the NDPA].
        </p>
        <h2>What we collect and why</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Legal basis (NDPA s.25)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Email, display name, password hash, age range</td>
              <td>Your account; age range protects teen learners</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Learning progress, notebook, answers, XP, streaks</td>
              <td>Running your course and revision schedule</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Conversation transcripts with AI tutors</td>
              <td>Showing you your history and summaries</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Voice recordings (only when you use the microphone)</td>
              <td>Turning speech into text</td>
              <td>Consent — you can withdraw it in Settings</td>
            </tr>
            <tr>
              <td>Usage events (e.g. “lesson completed”)</td>
              <td>Improving the product</td>
              <td>Legitimate interest — you can opt out in Settings</td>
            </tr>
            <tr>
              <td>Payment status from Paystack (no card details)</td>
              <td>Activating your plan</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Community contributions and recordings you choose to share</td>
              <td>Building the course</td>
              <td>Consent, given when you submit</td>
            </tr>
          </tbody>
        </table>
        <h2>Third parties that process your data</h2>
        <ul>
          <li>
            <strong>AI tutor provider</strong> (Anthropic, when configured): receives the text of your
            conversation and the context needed to reply. Not used to train models under the operator&apos;s
            API terms; check the provider&apos;s current terms.
          </li>
          <li>
            <strong>Speech provider</strong> (OpenAI or ElevenLabs, when configured): receives voice
            recordings for transcription and tutor text for the AI voice.
          </li>
          <li>
            <strong>Paystack</strong>: processes payments.
          </li>
          <li>
            <strong>Email provider</strong> (Resend, when configured): sends account emails.
          </li>
          <li>
            <strong>Hosting and database</strong>: [hosting provider, database provider, and the regions where
            data is stored].
          </li>
        </ul>
        <p>
          Some providers process data outside Nigeria. Transfers rely on [adequacy decision / standard
          contractual clauses / other NDPA-compliant mechanism — to be confirmed by counsel].
        </p>
        <h2>How long we keep it</h2>
        <ul>
          <li>Raw voice recordings from the speaking room: not stored by Over Sabi.</li>
          <li>
            Conversation transcripts: 90 days by default, then deleted automatically. Session summaries stay
            until you delete your account.
          </li>
          <li>Usage events: up to 13 months.</li>
          <li>Account and learning data: until you delete your account.</li>
          <li>Payment event records: as long as required for tax and accounting law.</li>
        </ul>
        <h2>Your rights</h2>
        <p>
          You can access and download your data (Settings → Privacy & data → Download my data), correct it,
          object to analytics, withdraw voice consent, and delete your account. You can also complain to the
          Nigeria Data Protection Commission.
        </p>
        <h2>Young learners</h2>
        <p>
          Accounts are for people aged 13 and over. Learners aged 13–17 can&apos;t appear on leaderboards. We
          don&apos;t offer public messaging or social feeds.
        </p>
        <h2>Training AI models</h2>
        <p>
          We don&apos;t use your private conversations or recordings to train AI models. If that ever changes,
          it will only be with your explicit, separate, opt-in consent.
        </p>
        <h2>Security</h2>
        <p>
          Passwords are hashed with scrypt. Learner data is isolated with database row-level security.
          Sessions use secure, HTTP-only cookies. Admin actions are logged.
        </p>
      </Prose>
    </div>
  );
}
