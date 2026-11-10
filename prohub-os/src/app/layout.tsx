import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Prohub Creative Solutions", template: "%s · Prohub" },
  description: "Brand, design, video, digital marketing and web — a creative agency in Nigeria serving ambitious businesses.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

const themeScript = `try{var t=localStorage.getItem('prohub-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">{themeScript}</Script>
        {children}
      </body>
    </html>
  );
}
