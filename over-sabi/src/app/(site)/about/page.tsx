import type { Metadata } from "next";
import { ToneContour } from "@/components/brand/ToneContour";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader eyebrow="About" title="Being sabi is more than memorising words" />
      <div className="flex flex-col gap-5 text-lg">
        <p>
          <em>Sabi</em> — from Nigerian Pidgin — means to know, to be skilled, to get it. Over Sabi exists for
          the moment you finally understand what your aunty said at the party, answer your grandfather in his
          own language, or close a deal in the market without switching to English.
        </p>
        <p>
          That kind of knowing is about more than vocabulary. It&apos;s greeting elders the right way, hearing
          the melody of a tonal language, and knowing which expression fits which moment.
        </p>
        <ToneContour text="Ẹ ṣé" animate className="my-2" />
        <h2 className="mt-6 text-2xl font-extrabold">What we believe</h2>
        <ul className="list-disc space-y-2 pl-6 text-base">
          <li>
            <strong>Accuracy before scale.</strong> Listing 50 languages is easy. Teaching one well is hard.
            We open courses only when there&apos;s content we can stand behind, and we label what hasn&apos;t
            been reviewed yet.
          </li>
          <li>
            <strong>Native speakers are the authority.</strong> AI can help draft and converse, but
            native-speaker reviewers decide what goes into a lesson.
          </li>
          <li>
            <strong>Honest technology.</strong> Speech tools for African languages are uneven. We test each
            language separately and say so when something is experimental.
          </li>
          <li>
            <strong>Africa is plural.</strong> No single ethnicity, religion or country stands for the
            continent — or for any one language&apos;s speakers.
          </li>
          <li>
            <strong>Learning, not screen time.</strong> We measure whether words stick, not just how long you
            stay in the app.
          </li>
        </ul>
        <h2 className="mt-6 text-2xl font-extrabold">Who it&apos;s for</h2>
        <p className="text-base">
          Young Nigerians and Africans learning a language beyond their own, diaspora learners reconnecting
          with family languages, partners and in-laws, travellers, businesses and schools.
        </p>
      </div>
      <div className="mt-10 flex gap-3">
        <ButtonLink href="/start">Start learning</ButtonLink>
        <ButtonLink href="/contribute" variant="secondary">
          Contribute a language
        </ButtonLink>
      </div>
    </div>
  );
}
