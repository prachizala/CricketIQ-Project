'use client';

import Link from 'next/link';

export default function HowItWorksPage() {
  const pillars = [
    {
      title: 'How well you played',
      subtitle: 'Runs, wickets, scoring speed, and bowling economy.',
      description: 'The foundation of every rating starts with what the player accomplished on the field — big runs, crucial wickets, and tight overs.',
      icon: (
        <svg className="w-6 h-6 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      bg: '#fef0f1',
    },
    {
      title: 'When it happened (early overs vs last overs)',
      subtitle: 'Powerplay restrictions vs high-stakes death overs.',
      description: 'Hitting boundaries in the closing overs or breaking a dangerous opening partnership during powerplay restrictions carries extra value.',
      icon: (
        <svg className="w-6 h-6 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      bg: '#eef2ff',
    },
    {
      title: 'Pressure of the moment (chasing, wickets left)',
      subtitle: 'Chasing targets, wickets in hand, and required run rate.',
      description: 'Stepping up when wickets are falling or when the required run rate climbs above 10 an over is what defines true match winners.',
      icon: (
        <svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bg: '#fef9ee',
    },
    {
      title: 'Match importance (playoffs and finals count more)',
      subtitle: 'Playoffs, qualifiers, and finals carry greater weight.',
      description: 'Every run and wicket in an elimination match or final matters more than a regular-season game where nothing is at stake.',
      icon: (
        <svg className="w-6 h-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      bg: '#f0fdf4',
    },
  ];

  const scoreBands = [
    { range: '75+', label: 'Elite', color: '#22c55e', desc: 'Match-winning performance that turned the game around' },
    { range: '60 – 75', label: 'High', color: '#84cc16', desc: 'Decisive, high-quality contribution to team success' },
    { range: '50 – 60', label: 'Good', color: '#eab308', desc: 'Solid, dependable performance in the match context' },
    { range: '35 – 50', label: 'Average', color: '#f97316', desc: 'Standard contribution without major game impact' },
    { range: '0 – 35', label: 'Low', color: '#ef4444', desc: 'Below expectations or had minimal influence on the outcome' },
  ];

  const faqs = [
    {
      q: 'Why not just look at batting averages and bowling strike rates?',
      a: 'Traditional stats treat every run equally. An 80 scored slowly when your team is already out of the game looks great on paper, but a quick 35 in a tense final-over chase actually wins trophies. CricketIQ measures what wins matches.',
    },
    {
      q: 'How does the pressure of the moment change the score?',
      a: 'Runs scored during steep chases or wickets taken when defending small totals receive much higher recognition. A boundary when you need 12 off 6 balls is worth far more than one scored when the game is already settled.',
    },
    {
      q: 'How is a player\'s recent form tracked?',
      a: 'Ratings focus on a player’s last 10 innings, giving the most recent games the greatest weight. This means you always see who is currently performing, not someone resting on their past reputation.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider mb-4">
          SIMPLE &amp; FAIR RATINGS
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] tracking-tight">
          How CricketIQ Works
        </h1>
        <p className="text-[#64748b] text-base sm:text-lg mt-3 max-w-2xl mx-auto">
          Every player gets a score from 0 to 100 that shows how much they truly helped their team win.
        </p>
      </div>

      {/* The 4 Core Factors */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-6 text-center sm:text-left">
          The Four Factors Behind Every Rating
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bg }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a1a2e]">{item.title}</h3>
                  <p className="text-xs font-medium text-[#94a3b8] mt-0.5">{item.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-[#64748b] leading-relaxed pl-16">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Real-World Example */}
      <section className="mb-14">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#e63946] text-xs font-bold uppercase tracking-wider">Real-World Example</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Numbers don’t tell the full story. Situation does.</h2>
          <p className="text-white/80 text-base leading-relaxed max-w-3xl">
            A quick <strong>35 in a final while chasing</strong> can be worth more than an <strong>80 in a match that was already lost</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Traditional View</span>
              <p className="text-sm text-white/90">
                Looks only at the scorecard total: &quot;80 runs is always better than 35.&quot;
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-xs text-[#22c55e] font-semibold block mb-1">CricketIQ View</span>
              <p className="text-sm text-white/90">
                Values match impact: the quick 35 delivered victory under intense pressure, earning an Elite rating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Score Guide */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2 text-center sm:text-left">
          Score Guide
        </h2>
        <p className="text-sm text-[#94a3b8] mb-6 text-center sm:text-left">
          Every performance is rated against five clear score bands.
        </p>
        <div className="space-y-3">
          {scoreBands.map((band) => (
            <div
              key={band.range}
              className="bg-white border border-black/[0.06] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
                <span className="font-bold text-base text-[#1a1a2e] w-24 shrink-0">{band.range}</span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: band.color + '15', color: band.color }}
                >
                  {band.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b]">{band.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-6 text-center sm:text-left">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-[#1a1a2e] mb-2">{faq.q}</h3>
              <p className="text-sm text-[#64748b] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="text-center pt-6 border-t border-black/[0.06]">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#e63946] text-white font-semibold text-sm rounded-xl hover:bg-[#c42d38] transition-all shadow-md"
        >
          Explore the Leaderboard
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
