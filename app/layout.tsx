import { Poppins } from 'next/font/google';
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

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-conceal',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${poppins.className} ${poppins.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
