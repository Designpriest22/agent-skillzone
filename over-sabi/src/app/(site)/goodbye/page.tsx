import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Account deleted" };

export default async function GoodbyePage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-20">
      <h1 className="text-4xl font-extrabold">Ó dàbọ̀. Ka ọ dị. Sai an jima.</h1>
      <p className="text-lg text-muted">Your account and learning data have been deleted.</p>
      {sp.subscription ? (
        <Notice tone="warning" title="About your subscription">
          You had an active paid plan. Deleting your account stops your access, but contact support to make
          sure no further payments are taken by the payment provider.
        </Notice>
      ) : null}
      <ButtonLink href="/" variant="secondary" className="self-start">
        Back to the homepage
      </ButtonLink>
    </div>
  );
}
