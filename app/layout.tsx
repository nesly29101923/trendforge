import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrendForge",
  description: "AI short-video trend engine for advertisers",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-lg">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="brand-gradient grid h-7 w-7 place-items-center rounded-lg text-sm font-black text-black">
                ⚡
              </span>
              <span className="text-lg">
                Trend<span className="text-gradient">Forge</span>
              </span>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
