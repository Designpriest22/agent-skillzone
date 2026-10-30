import type { Metadata } from "next";
import { SupportForm } from "@/components/site/SupportForm";
import { PageHeader } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Help & FAQs" };

const FAQ: [string, string][] = [
  [
    "Do I need an account?",
    "No — you can take a sample lesson straight away. Create a free account to save progress, keep a streak and talk to an AI tutor.",
  ],
  [
    "Which languages can I learn?",
    "Yoruba, Igbo and Hausa have beta starter courses. Nigerian Pidgin is in development. Many more are on our roadmap — see the Languages page for each one's status.",
  ],
  [
    "What does “Draft · awaiting review” mean?",
    "That item was written by our editorial team from widely documented expressions, but a native-speaker reviewer hasn't approved it yet. If you spot an error, tap “Report a problem”.",
  ],
  [
    "Are the tutors real people?",
    "No. Every tutor is an AI character, and we label them that way everywhere. Their replies can contain mistakes, especially in tone marks and idioms — treat them as practice, not an authority.",
  ],
  [
    "Can I speak instead of typing?",
    "Where a speech service supports your language, yes. Voice input for Yoruba, Igbo and Hausa is labelled experimental until we've tested it with native speakers; you'll always see the transcription before it's sent. Typing works everywhere.",
  ],
  [
    "Do you score my pronunciation?",
    "Not yet. We won't show pronunciation scores until they've been validated for each language. In the meantime you can record yourself in guided dialogues and compare.",
  ],
  [
    "How do I type tone marks and special letters?",
    "Lessons and the speaking room have a keyboard row for letters like ẹ, ọ, ṣ, ị, ụ, ɓ, ɗ and ƙ. For Yoruba tones, type the vowel then tap the high (◌́) or low (◌̀) tone button.",
  ],
  [
    "Does it work offline?",
    "Lessons you've opened are cached, so text lessons keep working on a weak connection. AI conversations and voice features need the internet.",
  ],
  [
    "What happens to my voice recordings?",
    "When you use voice input, the recording is sent to our speech provider to be transcribed and isn't stored by Over Sabi. Transcripts are kept for 90 days by default; summaries stay until you delete them.",
  ],
  [
    "How do I delete my account or download my data?",
    "Settings → Privacy & data. Downloads are a JSON file of everything we hold. Deletion is permanent.",
  ],
  [
    "Can my school or organisation use Over Sabi?",
    "Institutional plans are on our roadmap. Send us a message below.",
  ],
];

export default async function HelpPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader eyebrow="Help" title="Help & FAQs" />
      <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {q}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="lang-text mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
      <section id="contact" className="mt-12 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-extrabold">Contact us</h2>
        <SupportForm email={user?.email} />
      </section>
    </div>
  );
}
