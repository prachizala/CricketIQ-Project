'use client';

import Link from 'next/link';
import { MatchData } from '@/lib/types';
import { getTeamColor } from '@/lib/utils';

interface MatchSummaryProps {
  match: MatchData;
  compact?: boolean;
}

export default function MatchSummary({ match, compact = false }: MatchSummaryProps) {
  const team1 = match.teams[0];
  const team2 = match.teams[1];
  const inn1 = match.innings?.find(i => i.battingTeam === team1);
  const inn2 = match.innings?.find(i => i.battingTeam === team2);

  return (
    <Link href={`/matches/${match.matchId}`}>
      <div className="card-accent-top bg-white border border-black/[0.06] rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#94a3b8]">{match.date?.replace(/\//g, '-')}</span>
          <span className="text-xs text-[#cbd5e1]">{match.season}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTeamColor(team1) }} />
              <span className={`text-sm font-semibold ${match.winner === team1 ? 'text-[#e63946]' : 'text-[#1a1a2e]'}`}>
                {team1}
              </span>
            </div>
            {inn1 && (
              <p className="text-[#1a1a2e] font-bold ml-4 mt-0.5 text-sm">
                {inn1.totalRuns}/{inn1.totalWickets}
                <span className="text-[#b0b8c4] font-normal text-xs ml-1">({inn1.overs} ov)</span>
              </p>
            )}
          </div>

          <span className="text-[#cbd5e1] text-xs font-bold tracking-widest">VS</span>

          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-sm font-semibold ${match.winner === team2 ? 'text-[#e63946]' : 'text-[#1a1a2e]'}`}>
                {team2}
              </span>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTeamColor(team2) }} />
            </div>
            {inn2 && (
              <p className="text-[#1a1a2e] font-bold mr-4 mt-0.5 text-sm">
                {inn2.totalRuns}/{inn2.totalWickets}
                <span className="text-[#b0b8c4] font-normal text-xs ml-1">({inn2.overs} ov)</span>
              </p>
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-3 pt-3 border-t border-black/[0.05]">
            <p className="text-[13px] text-[#64748b]">
              {match.winner && (
                <>
                  <span className="text-[#e63946] font-semibold">{match.winner}</span> won
                  {match.winnerRuns > 0 && ` by ${match.winnerRuns} runs`}
                  {match.winnerWickets > 0 && ` by ${match.winnerWickets} wickets`}
                </>
              )}
            </p>
            {match.playerOfMatch && (
              <p className="text-xs text-[#94a3b8] mt-1">
                MVP: <span className="text-[#f59e0b] font-semibold">{match.playerOfMatch}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
