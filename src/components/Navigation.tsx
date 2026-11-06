'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Compare', href: '/compare' },
  { label: 'Matchups', href: '/matchups' },
  { label: 'Venues', href: '/venues' },
  { label: 'Clutch Index', href: '/clutch-index' },
  { label: 'Fantasy XI', href: '/fantasy-predictor' },
  { label: 'Simulator', href: '/simulator' },
  { label: 'Auction XI', href: '/auction-optimizer' },
  { label: 'AI Scout', href: '/scout' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e63946] to-[#ff4d5a] flex items-center justify-center">
              <span className="text-white font-bold text-xs">IQ</span>
            </div>
            <span className="font-semibold text-[#1a1a2e] text-sm tracking-tight">
              Cricket<span className="text-[#e63946] font-bold">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#e63946] bg-[#fef0f1]'
                      : 'text-[#64748b] hover:text-[#1a1a2e] hover:bg-black/[0.03]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-[#64748b] hover:text-[#1a1a2e] hover:bg-black/[0.04] transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-black/[0.05] bg-white/95 backdrop-blur-xl px-6 py-3 space-y-1 shadow-lg animate-fadeIn">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'text-[#e63946] bg-[#fef0f1]'
                    : 'text-[#475569] hover:text-[#1a1a2e] hover:bg-black/[0.03]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
