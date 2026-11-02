import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts served from public/fonts (copied from @fontsource on npm) so rendering never needs
// to reach Google Fonts.
export const HAND = "Patrick Hand";
export const ROUND = "Fredoka";
loadFont({ family: HAND, url: staticFile("fonts/PatrickHand.woff2"), weight: "400" });
loadFont({ family: ROUND, url: staticFile("fonts/Fredoka600.woff2"), weight: "600" });
