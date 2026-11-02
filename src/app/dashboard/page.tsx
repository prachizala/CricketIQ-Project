'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getTopPlayers, getRecentMatches, getAllPlayerImpacts, getMatches, getSeasons } from '@/lib/dataLoader';
import PlayerCard from '@/components/PlayerCard';
import MatchSummary from '@/components/MatchSummary';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '10px',
  color: '#1a1a2e',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};
const tooltipItemStyle = { color: '#1a1a2e' };
const tooltipLabelStyle = { color: '#64748b' };
const tooltipCursorBar = { fill: 'rgba(230,57,70,0.04)' };

export default function DashboardPage() {
  const data = useMemo(() => {
    const topPlayers = getTopPlayers(8);
    const recentMatches = getRecentMatches(6);
    const allPlayers = getAllPlayerImpacts();
    const matches = getMatches();
    const knockoutCount = matches.filter((m: { isKnockout?: boolean }) => m.isKnockout).length;

    const distribution = [
      { range: '0-20', count: 0, color: '#ef4444' },
      { range: '20-40', count: 0, color: '#f97316' },
      { range: '40-60', count: 0, color: '#eab308' },
      { range: '60-80', count: 0, color: '#84cc16' },
      { range: '80-100', count: 0, color: '#22c55e' },
    ];
    allPlayers.forEach(p => {
      const idx = Math.min(4, Math.floor(p.impactScore / 20));
      distribution[idx].count++;
    });

    const roles = [
      { name: 'Batsmen', value: allPlayers.filter(p => p.role === 'batsman').length, color: '#e63946' },
      { name: 'Bowlers', value: allPlayers.filter(p => p.role === 'bowler').length, color: '#6366f1' },
      { name: 'All-rounders', value: allPlayers.filter(p => p.role === 'allrounder').length, color: '#f59e0b' },
    ];

    const avgByRole = ['batsman', 'bowler', 'allrounder'].map(role => {
      const players = allPlayers.filter(p => p.role === role);
      const avg = players.length > 0
        ? players.reduce((s, p) => s + p.impactScore, 0) / players.length
        : 0;
      return { role: role === 'batsman' ? 'Batsmen' : role === 'bowler' ? 'Bowlers' : 'All-rounders', avg: Math.round(avg * 10) / 10 };
    });

    return { topPlayers, recentMatches, allPlayers, distribution, roles, avgByRole, knockoutCount, totalMatches: matches.length };
  }, []);

  const [matchSearch, setMatchSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const seasons = useMemo(() => getSeasons(), []);
  const allMatches = useMemo(() => getMatches(), []);

  const displayedMatches = useMemo(() => {
    let list = allMatches;
    if (seasonFilter) {
      list = list.filter(m => m.season === seasonFilter);
    }
    if (matchSearch.trim()) {
      const q = matchSearch.toLowerCase().trim();
      list = list.filter(m =>
        m.teams.some(t => t.toLowerCase().includes(q)) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (m.playerOfMatch && m.playerOfMatch.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 12);
  }, [allMatches, seasonFilter, matchSearch]);

  const avgImpact = (data.allPlayers.reduce((s, p) => s + p.impactScore, 0) / data.allPlayers.length).toFixed(1);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-left" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            ANALYTICS OVERVIEW
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Dashboard</h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Overview of player performance across {data.totalMatches.toLocaleString()} matches including {data.knockoutCount} playoff games.
        </p>
      </div>

      {/* Score Guide */}
      <div className="fade-in fade-in-1 bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-[#fef0f1] flex items-center justify-center">
            <span className="text-[#e63946] text-xs font-bold">★</span>
          </div>
          <span className="text-[#1a1a2e] text-sm font-semibold">Score Guide</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { range: '75+', label: 'Elite', color: '#22c55e' },
            { range: '60-75', label: 'High', color: '#84cc16' },
            { range: '50-60', label: 'Good', color: '#eab308' },
            { range: '35-50', label: 'Average', color: '#f97316' },
            { range: '0-35', label: 'Low', color: '#ef4444' },
          ].map(item => (
            <div key={item.range} className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] rounded-xl border border-black/[0.04]">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <span className="text-xs text-[#1a1a2e] font-bold">{item.range}</span>
                <span className="text-xs text-[#94a3b8] ml-1.5">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="fade-in fade-in-2 grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Players Rated', value: data.allPlayers.length, sub: 'minimum 5 matches', color: '#e63946' },
          { label: 'Average Score', value: avgImpact, sub: 'across all players', color: '#6366f1' },
          { label: 'Top Player', value: data.topPlayers[0]?.impactScore.toFixed(1), sub: data.topPlayers[0]?.name, color: '#f59e0b' },
          { label: 'Elite Players', value: data.allPlayers.filter(p => p.impactScore >= 60).length, sub: 'rated High or Elite', color: '#22c55e' },
          { label: 'Playoff Matches', value: data.knockoutCount, sub: 'high-stakes games', color: '#ef4444' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-[#94a3b8] font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-[#1a1a2e]">{stat.value}</p>
            <p className="text-[#b0b8c4] text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="fade-in fade-in-3 grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">Score Spread</h3>
          <p className="text-[#b0b8c4] text-xs mb-3">How players are distributed across score bands</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={tooltipCursorBar} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.distribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">Player Types</h3>
          <p className="text-[#b0b8c4] text-xs mb-3">Breakdown of batsmen, bowlers, and all-rounders</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.roles} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {data.roles.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={tooltipCursorBar} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {data.roles.map(r => (
              <div key={r.name} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color, opacity: 0.8 }} />
                {r.name} ({r.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">Average Score by Role</h3>
          <p className="text-[#b0b8c4] text-xs mb-3">Average score by player specialty</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.avgByRole} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
              <YAxis type="category" dataKey="role" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} width={90} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={tooltipCursorBar} />
              <Bar dataKey="avg" fill="#e63946" fillOpacity={0.7} radius={[0, 6, 6, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Players */}
      <div className="fade-in fade-in-4 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[#1a1a2e] text-lg font-semibold">Top Impact Players</h2>
            <p className="text-[#b0b8c4] text-xs mt-0.5">Highest rated players based on recent matches</p>
          </div>
          <Link href="/leaderboard" className="text-xs text-[#e63946] font-semibold hover:underline">
            Full Leaderboard &rarr;
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.topPlayers.map((player, i) => (
            <PlayerCard key={player.name} player={player} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Match Explorer */}
      <div className="fade-in fade-in-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[#1a1a2e] text-lg font-semibold">Match Explorer</h2>
            <p className="text-[#b0b8c4] text-xs mt-0.5">Explore impact across all {data.totalMatches.toLocaleString()} matches</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Search team, venue, MVP..."
              value={matchSearch}
              onChange={e => setMatchSearch(e.target.value)}
              className="px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-[#1a1a2e] placeholder-[#b0b8c4] text-xs focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 w-48 sm:w-56 shadow-sm transition-all"
            />
            <select
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-[#475569] text-xs focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 cursor-pointer shadow-sm transition-all"
            >
              <option value="">All Seasons</option>
              {seasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(matchSearch || seasonFilter) && (
              <button
                onClick={() => { setMatchSearch(''); setSeasonFilter(''); }}
                className="text-xs text-[#94a3b8] hover:text-[#ef4444] font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {displayedMatches.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMatches.map(match => (
              <MatchSummary key={match.matchId} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center text-[#94a3b8] text-sm shadow-sm">
            No matches found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
