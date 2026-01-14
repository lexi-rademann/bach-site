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
  title: "Camp Courtney",
  description: "Camp Courtney weekend HQ",
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
