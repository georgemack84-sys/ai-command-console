import Script from 'next/script';

import { application } from '@/config/application';
import { ThemeProvider } from '@/providers/theme-provider';

import type { Metadata } from 'next';

import '@/styles/index.css';

export const metadata: Metadata = {
  title: application.name,
  description: 'Proprium frontend foundation',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <Script src="/theme-bootstrap.js" strategy="beforeInteractive" />
        <ThemeProvider>{children}</ThemeProvider>
        <div id="proprium-overlay-root" />
      </body>
    </html>
  );
}
