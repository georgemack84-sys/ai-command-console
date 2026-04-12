import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/src/components/app/app-shell";
import { AppProvider } from "@/src/components/app/app-provider";
import { getSessionUser } from "@/src/lib/auth";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "AI Command Console",
  description: "Multi-agent command console with research workflows, operations tooling, and governed runtime surfaces.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sora.variable} ${spaceGrotesk.variable} antialiased`}>
        <AppProvider initialUser={sessionUser}>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
