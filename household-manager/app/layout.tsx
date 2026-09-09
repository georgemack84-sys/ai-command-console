import type { Metadata } from "next";
import "./styles.css";
import AccessGate from "./access-gate";

export const metadata: Metadata = {
  title: "Household Manager",
  description: "A calm command center for home."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AccessGate>{children}</AccessGate></body>
    </html>
  );
}
