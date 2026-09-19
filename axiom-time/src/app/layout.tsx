import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axiom Time",
  description: "A deterministic temporal-awareness layer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
