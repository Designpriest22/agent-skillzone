import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { allPlates } from "@/lib/content";
import { parsePlateKey, plateKey, plateSvg } from "@/lib/plates";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allPlates().map((p) => ({ file: `${plateKey(p)}.png` }));
}

const logo = () =>
  `data:image/svg+xml;base64,${fs.readFileSync(path.join(process.cwd(), "public/brand/destination-nigeria-logo-reverse.svg")).toString("base64")}`;

/** 1200×630 social card: the page's illustration plate with the official logo. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const plate = parsePlateKey(file.replace(/\.png$/, ""));
  if (!plate) return new Response("Not found", { status: 404 });
  const bg = `data:image/svg+xml;base64,${Buffer.from(plateSvg(plate)).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0a231b" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={1200} height={750} alt="" style={{ position: "absolute", top: -60, left: 0, width: 1200, height: 750 }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 360,
            display: "flex",
            backgroundImage: "linear-gradient(0deg, rgba(6,18,14,0.92), rgba(6,18,14,0))",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo()} width={360} height={141} alt="" style={{ position: "absolute", left: 64, bottom: 64 }} />
        <div style={{ position: "absolute", right: 64, bottom: 76, display: "flex", color: "#e8a432", fontSize: 28, letterSpacing: 2 }}>
          EXPERIENCE · INVEST · EXPLORE
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
