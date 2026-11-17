"use client";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-extrabold">This page didn&apos;t load</h1>
      <p className="text-muted">
        Something went wrong on our side, or your connection dropped. Your progress is saved.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <a href="/home" className="inline-flex min-h-11 items-center px-4 font-semibold underline">
          Go home
        </a>
      </div>
    </main>
  );
}
