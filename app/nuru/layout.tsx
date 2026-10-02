import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Nuru — Discover a deeper world",
  description: "A private daily journal for deliberately chosen discoveries.",
};

export default async function NuruLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Nuru routes are personalized and some are session-governed. Do not execute
  // their client UI during build-time prerendering.
  await connection();
  return children;
}
