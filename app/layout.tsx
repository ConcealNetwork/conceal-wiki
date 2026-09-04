import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

export const metadata = {
  title: { default: 'Conceal Wiki', template: '%s | Conceal Wiki' },
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
