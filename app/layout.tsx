import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Headline Flow",
  description: "A calm visual news slideshow for watching headlines one story at a time.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
