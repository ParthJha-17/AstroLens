import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroLens",
  description: "AI astronomy intelligence platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} bg-space-950`}>
      <body className="min-h-screen bg-space-950 text-slate-100 font-sans antialiased">
        <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-8">
          <Link href="/" className="text-blue-400 font-semibold text-lg tracking-tight">
            AstroLens
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
            Home
          </Link>
          <Link href="/search" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
            Search
          </Link>
          <Link href="/library" className="text-slate-400 hover:text-slate-100 text-sm transition-colors">
            Library
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
