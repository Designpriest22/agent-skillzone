import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Destination NG",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a231b",
    theme_color: "#103428",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
