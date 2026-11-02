'use client';

import Link from 'next/link';
import { PlayerImpact } from '@/lib/types';
import { getImpactColor, getTeamColor } from '@/lib/utils';

interface LeaderboardTableProps {
  players: PlayerImpact[];
  startRank?: number;
}

export default function LeaderboardTable({ players, startRank = 1 }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-black/[0.06]">
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">#</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">PLAYER</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">TEAM</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">IMPACT</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">MATCHES</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">ROLE</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">WIN %</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-[#94a3b8] tracking-wider">RECENT FORM</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const rank = startRank + index;
            const teamColor = getTeamColor(player.team);

            return (
              <tr
                key={player.name}
                className="border-b border-black/[0.04] table-row-hover group"
              >
                <td className="py-3 px-4">
                  <span className={`font-bold text-sm ${rank <= 3 ? 'text-[#e63946]' : 'text-[#cbd5e1]'}`}>
                    {String(rank).padStart(2, '0')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/players/${encodeURIComponent(player.name)}`}
                    className="text-[#1a1a2e] text-sm font-semibold hover:text-[#e63946] transition-colors"
                  >
                    {player.name}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                    <span className="text-[#64748b] text-[13px]">{player.team}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className="font-bold text-sm"
                    style={{ color: getImpactColor(player.impactScore) }}
                  >
                    {player.impactScore.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-[#64748b] text-[13px]">{player.matchesPlayed}</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs text-[#94a3b8] capitalize font-medium">
                    {player.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-[#64748b] text-[13px]">{player.winRate.toFixed(0)}%</td>
                <td className="py-3 px-4">
                  <div className="flex items-end gap-0.5 justify-end h-4" title="Recent Performance Form">
                    {player.recentForm.slice(-10).map((f, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-t-sm"
                        style={{
                          height: `${Math.max(15, (f / 100) * 100)}%`,
                          backgroundColor: getImpactColor(f),
                          opacity: 0.25 + (i / 10) * 0.6,
                        }}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
