import "./globals.css";
import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";
import { Cinzel, Great_Vibes, Inter } from "next/font/google";

const campSerif = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-camp",
});

const campScript = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://camp-courtney.vercel.app"),
  title: "Court's Bach - Jan 23-25 - Lake Delton",
  description: "Court's Bach - Jan 23-25 - Lake Delton",
  openGraph: {
    title: "Court's Bach - Jan 23-25 - Lake Delton",
    description: "Court's Bach - Jan 23-25 - Lake Delton",
    images: [
      {
        url: "/images/og-cabin.jpeg",
        width: 1200,
        height: 630,
        alt: "Camp Courtney cabin in winter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Court's Bach - Jan 23-25 - Lake Delton",
    description: "Court's Bach - Jan 23-25 - Lake Delton",
    images: ["/images/og-cabin.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${campSerif.variable} ${campScript.variable} ${body.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
