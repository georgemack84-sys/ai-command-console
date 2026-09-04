import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Noesis",
  description: "Noesis — evidence-backed curriculum planning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
