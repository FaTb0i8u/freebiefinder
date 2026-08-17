import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreebieFinder — Birthday Freebies Near You",
  description:
    "Discover and track free birthday gifts, meals, and treats from restaurants and retailers. No sign-up required.",
  manifest: "/manifest.json",
  openGraph: {
    title: "FreebieFinder — Birthday Freebies Near You",
    description:
      "Find and track free birthday gifts, meals, and treats from top restaurants and retailers.",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FreebieFinder",
    "theme-color": "#ec4899",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 dark:bg-zinc-950">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
