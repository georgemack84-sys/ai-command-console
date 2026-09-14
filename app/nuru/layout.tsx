import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuru — Discover a deeper world",
  description: "A private daily journal for deliberately chosen discoveries.",
};

export default function NuruLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
