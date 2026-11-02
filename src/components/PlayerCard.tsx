'use client';

import Link from 'next/link';
import { PlayerImpact } from '@/lib/types';
import { getImpactColor, getTeamColor } from '@/lib/utils';

interface PlayerCardProps {
  player: PlayerImpact;
  rank?: number;
}

export default function PlayerCard({ player, rank }: PlayerCardProps) {
  const teamColor = getTeamColor(player.team);

  return (
    <Link href={`/players/${encodeURIComponent(player.name)}`}>
      <div className="card-accent-top bg-white border border-black/[0.06] rounded-2xl p-4 hover:shadow-md transition-all group cursor-pointer shadow-sm">
        <div className="flex items-center justify-between mb-3">
          {rank && (
            <span className="text-xl font-bold text-black/15 leading-none">
              {String(rank).padStart(2, '0')}
            </span>
          )}
          <span className="text-xs text-[#94a3b8] capitalize font-medium">{player.role}</span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: teamColor + '12', color: teamColor, border: `1px solid ${teamColor}20` }}
          >
            {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="text-[#1a1a2e] text-sm font-semibold truncate group-hover:text-[#e63946] transition-colors">
              {player.name}
            </h3>
            <p className="text-[#94a3b8] text-xs">{player.team}</p>
          </div>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-black/[0.05]">
          <div>
            <span className="text-2xl font-bold" style={{ color: getImpactColor(player.impactScore) }}>
              {player.impactScore.toFixed(1)}
            </span>
            <p className="text-[11px] text-[#b0b8c4] font-medium mt-0.5">IMPACT</p>
          </div>
          <div className="text-right space-y-0.5 text-xs">
            {player.role !== 'bowler' && (
              <div className="text-[#94a3b8]" title="Strike Rate">
                Strike Rate <span className="text-[#475569] font-medium">{player.strikeRate.toFixed(0)}</span>
              </div>
            )}
            {player.role !== 'batsman' && (
              <div className="text-[#94a3b8]" title="Economy Rate">
                Economy <span className="text-[#475569] font-medium">{player.economy.toFixed(1)}</span>
              </div>
            )}
            <div className="text-[#94a3b8]" title={`${player.matchesPlayed} Matches, ${player.winRate.toFixed(0)}% Team Win Rate`}>
              <span>{player.matchesPlayed} Matches</span> &middot; <span className="text-[#475569] font-medium">{player.winRate.toFixed(0)}% Wins</span>
            </div>
          </div>
        </div>

        {player.recentForm.length > 0 && (
          <div className="mt-3 flex items-end gap-px h-4" title="Recent Form Trend">
            {player.recentForm.map((f, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${Math.max(15, (f / 100) * 100)}%`,
                  backgroundColor: getImpactColor(f),
                  opacity: 0.2 + (i / player.recentForm.length) * 0.6,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
