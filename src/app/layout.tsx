import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

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
      <body className="min-h-screen flex flex-col bg-[#f5f7fa] text-[#1a1a2e] antialiased">
        <Navigation />
        <main className="pt-14 flex-1">
          {children}
        </main>
        <footer className="border-t border-black/[0.06] bg-white py-8 mt-12 text-center text-xs text-[#94a3b8]">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1a2e] text-sm">Cricket<span className="text-[#e63946]">IQ</span></span>
              <span>&middot;</span>
              <span>ML-Powered Cricket Impact Metric</span>
            </div>
            <div className="flex items-center gap-6 text-[13px]">
              <Link href="/dashboard" className="hover:text-[#e63946] transition-colors">Dashboard</Link>
              <Link href="/leaderboard" className="hover:text-[#e63946] transition-colors">Leaderboard</Link>
              <Link href="/compare" className="hover:text-[#e63946] transition-colors">Compare</Link>
              <Link href="/matchups" className="hover:text-[#e63946] transition-colors">Matchups</Link>
              <Link href="/venues" className="hover:text-[#e63946] transition-colors">Venues</Link>
              <Link href="/simulator" className="hover:text-[#e63946] transition-colors">Simulator</Link>
              <Link href="/auction-optimizer" className="hover:text-[#e63946] transition-colors">Auction XI</Link>
              <Link href="/scout" className="hover:text-[#e63946] transition-colors">AI Scout</Link>
              <Link href="/how-it-works" className="hover:text-[#e63946] transition-colors">How It Works</Link>
              <a href="https://github.com/prachizala/CricketIQ-Project" target="_blank" rel="noopener noreferrer" className="hover:text-[#e63946] transition-colors">GitHub</a>
            </div>
            <div>
              <span>College Minor Project &middot; 2025-2026</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
