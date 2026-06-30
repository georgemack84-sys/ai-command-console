import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/src/components/app/app-shell";
import { AppProvider } from "@/src/components/app/app-provider";
import { getSessionUser } from "@/src/lib/auth";

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
      <body className="antialiased">
        <AppProvider initialUser={sessionUser}>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
