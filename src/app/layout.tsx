import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Z3DE.GG — Cinematic Landing",
  description: "Cinematic landing page (custom assets).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="grain text-white">{children}</body>
    </html>
  );
}
