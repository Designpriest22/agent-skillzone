/**
 * Resolves a public asset path. The hosted app serves files from /game/...; the standalone HTML
 * preview inlines every asset and registers them on window.__RTC_ASSETS before the app boots.
 */
type AssetWindow = { __RTC_ASSETS?: Record<string, string>; __RTC_PREVIEW?: boolean };
const w = (typeof window !== "undefined" ? window : {}) as AssetWindow;
export const asset = (path: string) => w.__RTC_ASSETS?.[path] ?? path;
export const isPreview = () => !!w.__RTC_PREVIEW;
