import type { Metadata } from 'next';
import { application } from '@/config/application';
import './globals.css';

export const metadata: Metadata = {
  title: application.name,
  description: 'Proprium frontend foundation',
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
