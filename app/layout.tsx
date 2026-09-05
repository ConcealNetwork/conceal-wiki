import { Geist, Geist_Mono } from 'next/font/google';
import type { Viewport } from 'next';
import { Provider } from '@/components/provider';
import './global.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1a1613' },
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
  ],
};

export const metadata = {
  metadataBase: new URL('https://concealnetwork.github.io/conceal-wiki/'),
  title: { default: 'Conceal Docs', template: '%s | Conceal Docs' },
  description: 'Documentation for Conceal Network.',
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-conceal',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-conceal-mono',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
