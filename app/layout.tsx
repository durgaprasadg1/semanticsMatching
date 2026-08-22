import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


// NOTE: your create-next-app scaffold likely already has Geist font setup
// here (next/font/google imports + className on <body>). Merge that back in
// if you want to keep it — this version is intentionally font-agnostic.
export const metadata: Metadata = {
  title: "NoteGraph",
  description: "A second brain that links itself.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>{children}</body>
    </html>
  );
}
