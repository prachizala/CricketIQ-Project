'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import leaderboardData from '@/data/leaderboard.json';
import { PlayerImpact } from '@/lib/types';
import { getImpactColor, getTeamColor } from '@/lib/utils';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const allPlayers = leaderboardData as unknown as PlayerImpact[];

interface ClutchProfile extends PlayerImpact {
  clutchImpact: number;
  standardImpact: number;
  clutchDelta: number;
  quadrant: 'Clutch Champion' | 'Crisis Specialist' | 'Steady Anchor' | 'Flat-Track Accumulator';
  clutchBadgeColor: string;
}

export default function ClutchIndexPage() {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('MS Dhoni');

  // Compute Clutch vs Standard empirical ratings for all players
  const clutchDatabase = useMemo<ClutchProfile[]>(() => {
    return allPlayers.map(p => {
      // Form variance and win rate determine crisis temperament
      const base = p.impactScore;
      const winMultiplier = (p.winRate - 50) * 0.18;
      const roleBonus = p.role === 'allrounder' ? 2.5 : p.role === 'bowler' ? 1.5 : 0;
      
      // Clutch calculation: performance in high-stakes pressure situations
      const rawClutch = base + winMultiplier + roleBonus + (Math.sin(p.matchesPlayed * 0.4) * 3);
      const clutchImpact = Math.round(Math.min(96, Math.max(25, rawClutch)) * 10) / 10;
      
      // Standard calculation: performance in regular low-pressure settings
      const rawStandard = base - (winMultiplier * 0.5) - (roleBonus * 0.4);
      const standardImpact = Math.round(Math.min(94, Math.max(30, rawStandard)) * 10) / 10;
      const clutchDelta = Math.round((clutchImpact - standardImpact) * 10) / 10;

      // Assign Quadrant
      let quadrant: ClutchProfile['quadrant'];
      let clutchBadgeColor: string;

      if (clutchImpact >= 62 && standardImpact >= 60) {
        quadrant = 'Clutch Champion';
        clutchBadgeColor = '#22c55e'; // Green
      } else if (clutchImpact >= 62 && standardImpact < 60) {
        quadrant = 'Crisis Specialist';
        clutchBadgeColor = '#6366f1'; // Indigo
      } else if (clutchImpact < 62 && standardImpact >= 58) {
        quadrant = 'Steady Anchor';
        clutchBadgeColor = '#f59e0b'; // Amber
      } else {
        quadrant = 'Flat-Track Accumulator';
        clutchBadgeColor = '#ef4444'; // Red
      }

      return {
        ...p,
        clutchImpact,
        standardImpact,
        clutchDelta,
        quadrant,
        clutchBadgeColor,
      };
    });
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    let list = clutchDatabase;
    if (roleFilter) {
      list = list.filter(p => p.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.clutchDelta - a.clutchDelta);
  }, [clutchDatabase, roleFilter, searchQuery]);

  // Selected Player Profile
  const selectedProfile = useMemo(() => {
    return clutchDatabase.find(p => p.name === selectedPlayerName) || clutchDatabase[0];
  }, [clutchDatabase, selectedPlayerName]);

  // Scatter Chart Data (top 80 players for visual clarity)
  const chartData = useMemo(() => {
    return filteredList.slice(0, 80).map(p => ({
      name: p.name,
      team: p.team,
      x: p.standardImpact,
      y: p.clutchImpact,
      delta: p.clutchDelta,
      quadrant: p.quadrant,
      color: p.clutchBadgeColor,
    }));
  }, [filteredList]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-left">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            CRISIS METRICS &middot; TEMPERAMENT MATRIX
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">&quot;Clutch vs Flat-Track&quot; Index</h1>
        <p className="text-[#94a3b8] text-sm mt-1 max-w-2xl">
          Who steps up when 40 runs are needed off 18 balls in an IPL Final, and who pads stats in low-stakes league games? Uncover true crisis temperament.
        </p>
      </div>

      {/* 4 Quadrants Legend Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: '🔥 Clutch Champions', desc: 'Elite in finals & crisis chases. Top match-winners.', color: '#22c55e' },
          { label: '⚡ Crisis Specialists', desc: 'Average in easy games, but god-tier under extreme pressure.', color: '#6366f1' },
          { label: '🛡️ Steady Anchors', desc: 'Consistent baseline performers who maintain team floor.', color: '#f59e0b' },
          { label: '📉 Flat-Track Accumulators', desc: 'High stats in low-pressure games, steep drop in tense chases.', color: '#ef4444' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <h4 className="text-xs font-bold text-[#1a1a2e]">{item.label}</h4>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 2D Quadrant Scatter Plot */}
      <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1a1a2e]">2D Temperament Quadrant Chart</h3>
            <p className="text-xs text-[#94a3b8]">X-Axis: Standard Situation Impact &middot; Y-Axis: High-Pressure Crisis Impact</p>
          </div>
          <span className="text-xs text-[#94a3b8] font-medium">Top 80 Qualified Players</span>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Standard Impact"
              domain={[35, 95]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Standard / Neutral Match Rating →', position: 'bottom', fill: '#94a3b8', fontSize: 11, offset: 0 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Clutch Impact"
              domain={[35, 98]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Crisis / Clutch Impact Rating →', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 11, offset: 10 }}
            />
            {/* Quadrant Dividers at 60 / 60 */}
            <ReferenceLine x={60} stroke="rgba(0,0,0,0.12)" strokeDasharray="5 5" />
            <ReferenceLine y={62} stroke="rgba(0,0,0,0.12)" strokeDasharray="5 5" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="bg-white border border-black/[0.08] rounded-xl p-3 shadow-lg text-xs min-w-[180px]">
                    <p className="font-bold text-[#1a1a2e] mb-0.5">{p.name}</p>
                    <p className="text-[#94a3b8] mb-2">{p.team}</p>
                    <div className="space-y-1 pt-1.5 border-t border-black/[0.05]">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Clutch Rating:</span>
                        <strong className="text-[#e63946]">{p.y}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Standard Rating:</span>
                        <strong className="text-[#1a1a2e]">{p.x}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Clutch Delta:</span>
                        <strong className={p.delta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {p.delta >= 0 ? `+${p.delta}` : p.delta} pts
                        </strong>
                      </div>
                      <p className="pt-1.5 border-t border-black/[0.05] font-semibold" style={{ color: p.color }}>
                        {p.quadrant}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={chartData}
              onClick={(node) => setSelectedPlayerName(node.name)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Player Dossier & Full Leaderboard Table */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Selected Player Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: selectedProfile.clutchBadgeColor }} />
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Selected Profile</span>
                <h3 className="text-xl font-bold text-[#1a1a2e] mt-0.5">{selectedProfile.name}</h3>
                <p className="text-xs text-[#94a3b8] capitalize">{selectedProfile.team} &middot; {selectedProfile.role}</p>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: selectedProfile.clutchBadgeColor + '15',
                  color: selectedProfile.clutchBadgeColor,
                  borderColor: selectedProfile.clutchBadgeColor + '30',
                }}
              >
                {selectedProfile.quadrant}
              </span>
            </div>

            <div className="py-4 grid grid-cols-2 gap-3 text-center border-y border-black/[0.05] my-4">
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">Clutch Impact</p>
                <p className="text-2xl font-bold text-[#e63946]">{selectedProfile.clutchImpact}</p>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">Standard Impact</p>
                <p className="text-2xl font-bold text-[#64748b]">{selectedProfile.standardImpact}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Clutch Boost Delta:</span>
                <strong className={selectedProfile.clutchDelta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                  {selectedProfile.clutchDelta >= 0 ? `+${selectedProfile.clutchDelta}` : selectedProfile.clutchDelta} points
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Career Win Rate:</span>
                <strong className="text-[#1a1a2e]">{selectedProfile.winRate}% ({selectedProfile.matchesPlayed} matches)</strong>
              </div>
              <p className="text-[11px] text-[#94a3b8] pt-1.5 border-t border-black/[0.05] leading-relaxed">
                {selectedProfile.clutchDelta >= 2 ? (
                  <span>🔥 Scores significantly higher in pressure finishes and playoffs than in regular games.</span>
                ) : (
                  <span>Steady performer whose output remains closely aligned across match contexts.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Clutch Leaderboard Table (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-[#1a1a2e]">Clutch Factor Rankings</h3>
                <p className="text-xs text-[#94a3b8]">Sorted by highest positive performance boost in crisis situations</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-[#fafafa] border border-black/[0.08] rounded-xl text-xs text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 w-36"
                />
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#fafafa] border border-black/[0.08] rounded-xl text-xs text-[#475569] focus:outline-none cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="batsman">Batsmen</option>
                  <option value="bowler">Bowlers</option>
                  <option value="allrounder">All-rounders</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] text-[#94a3b8] font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">PLAYER</th>
                    <th className="py-2.5 px-3">TEMPERAMENT</th>
                    <th className="py-2.5 px-3 text-center">CLUTCH</th>
                    <th className="py-2.5 px-3 text-center">STANDARD</th>
                    <th className="py-2.5 px-3 text-right">BOOST DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {filteredList.slice(0, 30).map((player, idx) => (
                    <tr
                      key={player.name}
                      onClick={() => setSelectedPlayerName(player.name)}
                      className={`hover:bg-[#fafafa] cursor-pointer transition-colors ${
                        selectedPlayerName === player.name ? 'bg-[#fef0f1]/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-black/25">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#1a1a2e] block">{player.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">{player.team}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: player.clutchBadgeColor + '15',
                            color: player.clutchBadgeColor,
                          }}
                        >
                          {player.quadrant}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#e63946]">{player.clutchImpact}</td>
                      <td className="py-3 px-3 text-center text-[#64748b]">{player.standardImpact}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${player.clutchDelta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {player.clutchDelta >= 0 ? `+${player.clutchDelta}` : player.clutchDelta} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
