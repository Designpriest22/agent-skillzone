import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { heroScenes } from "@/lib/content";
import { plateSvg } from "@/lib/plates";

export const alt = "Destination Nigeria — Experience. Invest. Explore.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bg = `data:image/svg+xml;base64,${Buffer.from(plateSvg(heroScenes[0]!.plate)).toString("base64")}`;
  const logo = `data:image/svg+xml;base64,${fs.readFileSync(path.join(process.cwd(), "public/brand/destination-nigeria-logo-reverse.svg")).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0a231b" }}>
        <img src={bg} width={1200} height={750} alt="" style={{ position: "absolute", top: -40, left: 0 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "linear-gradient(0deg, rgba(6,18,14,0.9), rgba(6,18,14,0.1) 70%)" }} />
        <img src={logo} width={460} height={181} alt="" style={{ position: "absolute", left: 64, bottom: 110 }} />
        <div style={{ position: "absolute", left: 68, bottom: 64, display: "flex", color: "#e8a432", fontSize: 30, letterSpacing: 3 }}>
          EXPERIENCE · INVEST · EXPLORE
        </div>
      </div>
    ),
    size,
  );
}
