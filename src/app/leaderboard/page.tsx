'use client';

import { useMemo, useState } from 'react';
import { getAllPlayerImpacts, getTeams } from '@/lib/dataLoader';
import LeaderboardTable from '@/components/LeaderboardTable';

export default function LeaderboardPage() {
  const [teamFilter, setTeamFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const allPlayers = useMemo(() => getAllPlayerImpacts(), []);
  const teams = useMemo(() => getTeams(), []);

  const filteredPlayers = useMemo(() => {
    let result = allPlayers;
    if (teamFilter) result = result.filter(p => p.team === teamFilter);
    if (roleFilter) result = result.filter(p => p.role === roleFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [allPlayers, teamFilter, roleFilter, searchQuery]);

  const eliteCount = allPlayers.filter(p => p.impactScore >= 60).length;
  const avgImpact = (allPlayers.reduce((s, p) => s + p.impactScore, 0) / allPlayers.length).toFixed(1);

  const exportToCSV = () => {
    const headers = ['Rank', 'Player', 'Team', 'Impact Score', 'Matches', 'Role', 'Win Rate (%)', 'Strike Rate', 'Economy'];
    const rows = filteredPlayers.map((p, idx) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.team.replace(/"/g, '""')}"`,
      p.impactScore.toFixed(1),
      p.matchesPlayed,
      p.role,
      p.winRate.toFixed(1),
      p.strikeRate.toFixed(1),
      p.economy.toFixed(1),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cricket_impact_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8 slide-in-left" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            PLAYER RANKINGS
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Leaderboard</h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Players ranked by their recent match-winning impact.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="fade-in fade-in-1 grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-[#94a3b8] font-medium">Total Players</p>
          <p className="text-2xl font-bold text-[#1a1a2e]">{allPlayers.length}</p>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-[#94a3b8] font-medium">Average Rating</p>
          <p className="text-2xl font-bold text-[#6366f1]">{avgImpact}</p>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-[#94a3b8] font-medium">High &amp; Elite (60+)</p>
          <p className="text-2xl font-bold text-[#22c55e]">{eliteCount}</p>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="fade-in fade-in-2 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-black/[0.08] rounded-xl text-[#1a1a2e] placeholder-[#b0b8c4] text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946]/30 w-60 transition-all shadow-sm"
            />
          </div>

          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-black/[0.08] rounded-xl text-[#475569] text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 cursor-pointer appearance-none transition-all shadow-sm"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-black/[0.08] rounded-xl text-[#475569] text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 cursor-pointer appearance-none transition-all shadow-sm"
          >
            <option value="">All Roles</option>
            <option value="batsman">Batsman</option>
            <option value="bowler">Bowler</option>
            <option value="allrounder">All-rounder</option>
          </select>

          {(teamFilter || roleFilter || searchQuery) && (
            <button
              onClick={() => { setTeamFilter(''); setRoleFilter(''); setSearchQuery(''); }}
              className="px-4 py-2.5 text-sm text-[#94a3b8] hover:text-[#ef4444] transition-colors font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-black/[0.08] text-[#1a1a2e] hover:border-[#e63946]/40 hover:text-[#e63946] text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          title="Download filtered leaderboard as CSV spreadsheet"
        >
          <svg className="w-3.5 h-3.5 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="fade-in fade-in-3 text-xs text-[#94a3b8] mb-4 font-medium flex items-center flex-wrap gap-2">
        <span>Showing {filteredPlayers.length} of {allPlayers.length} players</span>
        <span className="text-black/10">|</span>
        <span>Score is based on a player&apos;s last 10 innings. Form shows recent ups and downs.</span>
      </div>

      <div className="fade-in fade-in-4 bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden">
        {filteredPlayers.length > 0 ? (
          <LeaderboardTable players={filteredPlayers.slice(0, 50)} />
        ) : (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-[#1a1a2e] mb-1">No players found</p>
            <p className="text-sm text-[#94a3b8]">Try searching another player name or clear the team and role filters.</p>
          </div>
        )}
      </div>

      {filteredPlayers.length > 50 && (
        <p className="text-center text-[#94a3b8] text-xs mt-4">
          Showing top 50 of {filteredPlayers.length}
        </p>
      )}
    </div>
  );
}
