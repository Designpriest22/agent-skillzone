import Link from "next/link";
import { PolicyPage, ToConfirm } from "@/components/PolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Accessibility statement", description: "Destination Nigeria's accessibility commitment, known limitations and how to report a problem.", path: "/accessibility" });

export default function AccessibilityPage() {
  return (
    <PolicyPage title="Accessibility statement" path="/accessibility" updated="2026-10-26">
      <p>We want everyone to be able to use Destination Nigeria. The site is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.</p>
      <h2>What we have done</h2>
      <ul>
        <li>Semantic headings, landmarks and a skip link on every page.</li>
        <li>Everything works with a keyboard, with a visible focus indicator.</li>
        <li>The map can be used with a mouse, a keyboard (arrow keys and Enter), or the text-based state finder.</li>
        <li>The background film can be paused, and has a text description. Motion is reduced automatically if your device asks for reduced motion.</li>
        <li>Sound never plays without your action, and the site works fully without it.</li>
        <li>Forms have visible labels, clear error messages and do not rely on colour alone.</li>
        <li>Text colours meet AA contrast ratios against their backgrounds.</li>
      </ul>
      <h2>Known limitations</h2>
      <ul>
        <li>Images are original illustrations. Their text alternatives describe the illustration, not the real place; photographs with descriptions will follow.</li>
        <li>Some linked official sources are external sites we do not control.</li>
      </ul>
      <h2 id="visitor-access">Accessibility at destinations</h2>
      <p>
        Step-free access, accessible toilets and other facilities will be recorded destination by destination as operators verify them. Until then, contact the site operator before you travel. Operators can share access information through the{" "}
        <Link href="/partners?interest=showcase#enquiry">partnership form</Link>.
      </p>
      <h2>Report a problem</h2>
      <p>
        If something on this site does not work for you, tell us at <ToConfirm>accessibility contact email</ToConfirm>. We aim to respond within <ToConfirm>response time, e.g. 5 working days</ToConfirm>.
      </p>
    </PolicyPage>
  );
}
