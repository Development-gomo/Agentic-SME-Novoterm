import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novoterm — Agent Layer",
  description: "Machine-readable GEO/AI-visibility layer for novoterm.se.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
