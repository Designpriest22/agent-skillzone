import type { Metadata } from "next";
import { ReviewQueue } from "@/components/app/ReviewQueue";
import { PageHeader } from "@/components/ui/primitives";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage() {
  await requirePageUser();
  return (
    <div>
      <PageHeader eyebrow="Spaced repetition" title="Revision">
        Recall each word before you reveal it. Be honest with your rating — it decides when you&apos;ll see
        the word again.
      </PageHeader>
      <ReviewQueue />
    </div>
  );
}
