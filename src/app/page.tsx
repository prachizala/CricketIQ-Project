'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getTopPlayers, getMatches } from '@/lib/dataLoader';
import { getImpactColor } from '@/lib/utils';

export default function HomePage() {
  const stats = useMemo(() => {
    const players = getTopPlayers(5);
    const matches = getMatches();
    const knockouts = matches.filter((m: { isKnockout?: boolean }) => m.isKnockout).length;
    return { topPlayers: players, totalMatches: matches.length, knockouts };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fef0f1 0%, #fcd5d8 30%, #e63946 70%, #c42d38 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(230,57,70,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)',
          }} />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">

            {/* Left — Hero text */}
            <div className="lg:col-span-7">
              <div className="slide-in-left flex items-center gap-2.5 mb-6" style={{ animationDelay: '0.1s' }}>
                <div className="px-3.5 py-1 rounded-full bg-[#e63946]/10 backdrop-blur-sm border border-[#e63946]/20">
                  <span className="text-xs font-semibold text-[#e63946] tracking-wide">
                    MATCH-WINNING CRICKET INTELLIGENCE
                  </span>
                </div>
              </div>

              <h1 className="slide-in-left" style={{ animationDelay: '0.2s' }}>
                <span className="block text-[clamp(2.5rem,6vw,5rem)] font-extrabold text-[#1a1a2e] leading-[1.05] tracking-[-0.03em]">
                  Measure the real
                </span>
                <span className="block text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#e63946]">
                  impact of cricket.
                </span>
              </h1>

              <p className="slide-in-left text-[#64748b] text-lg mt-6 max-w-lg leading-relaxed" style={{ animationDelay: '0.35s' }}>
                A single score from 0 to 100 that shows how much a player really helped their team win.
              </p>

              {/* CTAs */}
              <div className="slide-in-left flex items-center gap-4 mt-10" style={{ animationDelay: '0.55s' }}>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-[#e63946] text-white font-semibold text-sm rounded-xl hover:bg-[#c42d38] transition-all shadow-lg shadow-[#e63946]/20"
                >
                  Explore Dashboard
                </Link>
                <Link
                  href="/how-it-works"
                  className="px-6 py-3 border border-[#e63946]/30 text-[#e63946] font-medium text-sm rounded-xl hover:bg-[#e63946]/5 transition-all bg-white/70"
                >
                  How It Works
                </Link>
              </div>

              {/* Stats row */}
              <div className="slide-in-left flex items-center gap-8 mt-10" style={{ animationDelay: '0.65s' }}>
                {[
                  { value: stats.totalMatches.toLocaleString(), label: 'Matches Analyzed' },
                  { value: '768+', label: 'Players Rated' },
                  { value: stats.knockouts.toString(), label: 'Playoff Matches' },
                  { value: '18', label: 'Seasons' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-[#1a1a2e]">{s.value}</p>
                    <p className="text-[#94a3b8] text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Top players card */}
            <div className="lg:col-span-5">
              <div className="slide-in-right bg-white rounded-2xl shadow-2xl shadow-black/15 overflow-hidden" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between px-5 py-3.5 bg-[#fafafa] border-b border-black/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#e63946]" />
                    <span className="font-semibold text-[13px] text-[#1a1a2e]">Top Impact Rankings</span>
                  </div>
                  <span className="text-xs font-semibold text-[#e63946]">TOP PLAYERS</span>
                </div>

                <div className="divide-y divide-black/[0.04]">
                  {stats.topPlayers.map((player, i) => (
                    <Link key={player.name} href={`/players/${encodeURIComponent(player.name)}`}>
                      <div className="group px-5 py-3.5 flex items-center gap-4 hover:bg-[#fff5f5] transition-colors cursor-pointer">
                        <span className="text-xl font-bold text-black/20 w-7 shrink-0 leading-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>

                        <div className="flex-1 min-w-0">
                          <span className="text-[#1a1a2e] text-sm font-semibold group-hover:text-[#e63946] transition-colors truncate block">
                            {player.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#94a3b8]">{player.team}</span>
                            <span className="text-black/10">|</span>
                            <span className="text-xs text-[#94a3b8] capitalize">{player.role}</span>
                          </div>
                        </div>

                        <span className="text-lg font-bold shrink-0" style={{ color: getImpactColor(player.impactScore) }}>
                          {player.impactScore.toFixed(1)}
                        </span>

                        {player.recentForm.length > 0 && (
                          <div className="hidden sm:flex items-end gap-0.5 h-5 w-14 shrink-0">
                            {player.recentForm.map((f, idx) => (
                              <div
                                key={idx}
                                className="flex-1 rounded-t-sm"
                                style={{
                                  height: `${Math.max(15, (f / 100) * 100)}%`,
                                  backgroundColor: getImpactColor(f),
                                  opacity: 0.25 + (idx / player.recentForm.length) * 0.6,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="px-5 py-3 bg-[#fafafa] border-t border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">768 players rated</span>
                  <Link href="/leaderboard" className="text-xs text-[#e63946] font-semibold hover:underline transition-colors">
                    View Full Leaderboard &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60V30C240 5 480 0 720 15C960 30 1200 45 1440 30V60H0Z" fill="#f5f7fa"/>
          </svg>
        </div>
      </section>

      {/* How the Score Works — 4 pillars */}
      <section className="py-20 bg-[#f5f7fa]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider mb-4">
              METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight">
              Four factors. <span className="text-[#94a3b8]">One clear rating.</span>
            </h2>
            <p className="text-[#64748b] text-sm sm:text-base mt-3 max-w-xl mx-auto">
              Every performance is measured by what was done, when it happened, the pressure on the line, and the match stakes.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {[
              {
                title: 'Quality of Performance',
                color: '#e63946',
                bgColor: '#fef0f1',
                lines: ['Runs scored & strike rate', 'Boundaries (4s & 6s)', 'Wickets taken & economy', 'Dot balls bowled'],
                desc: 'On-field production — evaluating clean ball striking, crucial breakthroughs, and economical bowling.',
              },
              {
                title: 'When It Happened',
                color: '#6366f1',
                bgColor: '#eef2ff',
                lines: ['Powerplay field restrictions', 'Middle-overs building phase', 'Death-overs boundary hitting', 'Chasing vs defending roles'],
                desc: 'Phase context matters. Powerplay wickets break openers; death-overs boundaries close out matches.',
              },
              {
                title: 'Pressure of the Moment',
                color: '#f59e0b',
                bgColor: '#fef9ee',
                lines: ['Steep required run rates', 'Few wickets in hand', 'Defending small totals', 'Clutch final-over finishes'],
                desc: 'Clutch situations. Scoring when required rates climb or keeping it tight when defending 140 counts extra.',
              },
              {
                title: 'Match Importance',
                color: '#22c55e',
                bgColor: '#f0fdf4',
                lines: ['Playoff qualifiers', 'Elimination thrillers', 'Grand final title matches', 'Tournament-defining games'],
                desc: 'Stakes on the line. Playoff knockout matches carry greater importance than routine league matches.',
              },
            ].map(card => (
              <div
                key={card.title}
                className="card-accent-top bg-white rounded-2xl p-6 border border-black/[0.06] hover:shadow-lg hover:shadow-black/[0.04] transition-all group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: card.bgColor, color: card.color }}>
                    ★
                  </div>
                  <span className="text-xs font-semibold tracking-wide" style={{ color: card.color }}>{card.title}</span>
                </div>

                <p className="text-[#64748b] text-sm leading-relaxed mb-5">{card.desc}</p>

                <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                  {card.lines.map(line => (
                    <div key={line} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                      <span className="text-xs text-[#475569]">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-black/[0.08] text-[#1a1a2e] font-semibold text-sm rounded-xl hover:bg-black/[0.02] transition-all shadow-sm"
            >
              Learn More About How It Works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* What Makes CricketIQ Different */}
      <section className="py-20 bg-white border-t border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider mb-4">
              WHY CRICKETIQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight">
              Built for how cricket is <span className="text-[#e63946]">actually won</span>.
            </h2>
            <p className="text-[#64748b] text-sm sm:text-base mt-3 max-w-xl mx-auto">
              Traditional stats look backwards at aggregate totals. CricketIQ evaluates match impact.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {[
              {
                title: 'Playoff & Final Stakes',
                desc: 'A 50 in the championship final is not the same as a 50 in an ordinary league match. High-stakes games are appropriately rewarded.',
                color: '#22c55e',
                stat: 'Playoffs Weighted Higher',
              },
              {
                title: 'Defending Pressure',
                desc: 'Bowlers defending low totals with tight economy get crucial recognition. Keeping things tight in a 140-run thriller wins games.',
                color: '#f59e0b',
                stat: 'Low-Total Economy Credit',
              },
              {
                title: 'Transparent & Fair',
                desc: 'Every player score comes with clear highlights explaining whether finishing, consistency, or pressure play drove their rating.',
                color: '#6366f1',
                stat: 'Clear Performance Highlights',
              },
              {
                title: 'Recent Form Tracking',
                desc: 'Scores reflect recent form across their last 10 matches, highlighting who is currently in top touch rather than past reputation.',
                color: '#e63946',
                stat: 'Weighted Towards Current Form',
              },
            ].map(item => (
              <div key={item.title} className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: item.color + '15' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <h3 className="text-[#1a1a2e] font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed mb-4">{item.desc}</p>
                <span className="text-xs font-semibold tracking-wide" style={{ color: item.color }}>{item.stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#e63946] to-[#ff4d5a] flex items-center justify-center">
              <span className="text-white font-bold text-[9px]">IQ</span>
            </div>
            <span className="text-sm font-semibold text-[#1a1a2e]">CricketIQ</span>
          </div>
          <span className="text-xs text-[#94a3b8]">
            Not just what they scored. What they changed.
          </span>
        </div>
      </footer>
    </div>
  );
}
