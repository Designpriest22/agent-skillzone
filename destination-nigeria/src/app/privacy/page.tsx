import Link from "next/link";
import { PolicyPage, ToConfirm } from "@/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Privacy policy", description: "How Destination Nigeria collects, uses and protects personal information.", path: "/privacy" });

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy" path="/privacy" updated="2026-10-26">
      <p>
        This policy explains what personal information Destination Nigeria collects through this website, why, and the choices you have. We aim to comply with the Nigeria Data Protection Act 2023 and, where they apply to you, the EU and UK GDPR.
      </p>
      <h2>Who we are</h2>
      <p>
        The data controller is <ToConfirm>legal name and address of the organisation operating Destination Nigeria</ToConfirm>. Privacy questions: <ToConfirm>privacy contact email</ToConfirm>.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Newsletter sign-ups:</strong> your email address, the audience you choose (for example traveller or investor) and the topics you tick.
        </li>
        <li>
          <strong>Investment and partnership enquiries:</strong> your name, work email, organisation, role or investor type, the details you write in your message and, optionally, country, website and areas of interest.
        </li>
        <li>
          <strong>Your consent choice</strong> for each form, and when it was given.
        </li>
      </ul>
      <p>We do not ask for sensitive personal data. Please do not include confidential financial or personal information in free-text fields.</p>
      <h2>What stays on your device</h2>
      <p>
        Your trip shortlist, sound preference, welcome-screen status and analytics choice are stored in your own browser&apos;s local storage. They are never sent to us. See <Link href="/cookies">cookies and storage</Link>.
      </p>
      <h2>Why we use it</h2>
      <ul>
        <li>To reply to your enquiry and follow up on it (legitimate interests, or steps at your request before a possible agreement).</li>
        <li>To send the newsletter you asked for (consent, which you can withdraw at any time using the unsubscribe link).</li>
        <li>To protect the service from spam and abuse (legitimate interests). We briefly process your IP address to limit repeated submissions; it is not stored with your enquiry.</li>
      </ul>
      <h2>Who we share it with</h2>
      <p>
        Form submissions are delivered to the services we use to manage enquiries and email, acting as our processors: <ToConfirm>names of the CRM, email and hosting providers in use</ToConfirm>. We do not sell personal data or use it for advertising.
      </p>
      <h2>How long we keep it</h2>
      <p>
        Enquiries are kept for <ToConfirm>retention period, e.g. 24 months after last contact</ToConfirm>. Newsletter data is kept until you unsubscribe.
      </p>
      <h2>Analytics</h2>
      <p>If enabled, we use cookieless, privacy-friendly analytics only after you allow it. It counts page views and actions such as using the itinerary builder, without collecting personal data.</p>
      <h2>Your rights</h2>
      <p>
        You can ask to access, correct, delete or move your data, object to or restrict its use, and withdraw consent. Contact <ToConfirm>privacy contact email</ToConfirm>. You can also complain to the Nigeria Data Protection Commission or your local data protection authority.
      </p>
    </PolicyPage>
  );
}
