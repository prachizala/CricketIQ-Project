import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CricketIQ - See which players really win matches',
  description: 'CricketIQ measures real match-winning impact in cricket. See which players truly change the game with a single 0-100 rating.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f7fa] text-[#1a1a2e] antialiased">
        <Navigation />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
