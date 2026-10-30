import { ButtonLink } from "@/components/ui/Button";
import { ToneContour } from "@/components/brand/ToneContour";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="text-4xl font-extrabold">
        <span lang="yo" className="lang-text">
          Kò sí níbí.
        </span>
      </h1>
      <ToneContour text="Kò sí níbí" />
      <p className="text-muted">It&apos;s not here — that page doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/" className="self-start">
        Go to the homepage
      </ButtonLink>
    </main>
  );
}
