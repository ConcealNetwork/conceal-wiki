import { Poppins } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

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
