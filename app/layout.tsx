import type { Metadata } from "next";
import "./globals.css";

// NOTE: your create-next-app scaffold likely already has Geist font setup
// here (next/font/google imports + className on <body>). Merge that back in
// if you want to keep it — this version is intentionally font-agnostic.
export const metadata: Metadata = {
  title: "NoteGraph",
  description: "A second brain that links itself.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
