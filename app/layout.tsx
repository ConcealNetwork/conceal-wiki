import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

export const metadata = {
  metadataBase: new URL('https://concealnetwork.github.io/conceal-wiki/'),
  title: { default: 'Conceal Docs', template: '%s | Conceal Docs' },
  description: 'Documentation for Conceal Network.',
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
