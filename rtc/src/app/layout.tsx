import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter-tight";
import "@fontsource/bebas-neue";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "Run The Capital · A Prohub Creative Solutions game",
  description: "An Abuja street beat 'em up. Pick your fighter, run the districts, take the city back from the Vibe Killers.",
  openGraph: { title: "Run The Capital", description: "Fight through Abuja. Climb CAPITAL STATUS.", images: ["/game/logo.webp"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#170a06" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
