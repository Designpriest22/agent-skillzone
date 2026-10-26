import type { Plate as PlateSpec } from "@/content/schema";
import { plateAlt } from "@/lib/content";
import { plateKey } from "@/lib/plates";

/**
 * An illustration plate as an image. `decorative` plates get empty alt text;
 * informative ones describe what is drawn (never claiming to be a photograph).
 * The "Illustration" tag tells sighted visitors the same thing.
 */
export function Plate({
  plate,
  alt,
  decorative = false,
  priority = false,
  className = "plate",
  tag = true,
  sizes,
}: {
  plate: PlateSpec;
  alt?: string;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
  tag?: boolean;
  sizes?: string;
}) {
  return (
    <div className={className}>
      {/* SVG plates are vector and already small; next/image adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/plates/${plateKey(plate)}.svg`}
        alt={decorative ? "" : (alt ?? plateAlt(plate.scene))}
        width={1600}
        height={1000}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes}
      />
      {tag ? (
        <span className="plate-tag" aria-hidden="true">
          Illustration
        </span>
      ) : null}
    </div>
  );
}
