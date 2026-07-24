import type { Metadata } from 'next';
import Script from 'next/script';
import { application } from '@/config/application';
import '@/styles/index.css';
import { AppProviders } from '@/providers/app-providers';

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
        <AppProviders>{children}</AppProviders>
        <div id="proprium-overlay-root" />
      </body>
    </html>
  );
}
