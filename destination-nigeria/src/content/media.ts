/**
 * Media register: the single place licensed photography and footage are
 * plugged in. Every entry must carry its source, licence and attribution.
 * See docs/ASSETS.md for the approval checklist.
 */

export type LicensedMedia = {
  src: string;
  type: "image/avif" | "image/webp" | "image/jpeg" | "video/mp4" | "video/webm";
  /** Location actually depicted. Must match the page it is used on. */
  depicts: string;
  creator: string;
  source: string;
  licence: string;
  attributionRequired: boolean;
  commercialUseConfirmed: boolean;
};

export type HeroFilm = {
  sources: { src: string; type: "video/mp4" | "video/webm"; media?: string }[];
  /** Static poster shown before playback and when video is unavailable. */
  poster: string;
  /** WebVTT captions or descriptions, required if the film carries meaning beyond decoration. */
  captions?: string;
  /** Text alternative describing the sequence, shown on request. */
  transcript: string;
  credits: LicensedMedia[];
};

/**
 * Licensed hero film. `null` until approved footage is supplied; the site then
 * uses the original illustrated sequence, which needs no licence.
 */
export const heroFilm: HeroFilm | null = null;

/** Licensed photography by destination slug. Empty until approved images are supplied. */
export const destinationPhotos: Record<string, LicensedMedia[]> = {};
