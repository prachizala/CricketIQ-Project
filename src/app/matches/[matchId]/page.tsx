'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMatchById, getMatchImpactPlayers, getPlayerData } from '@/lib/dataLoader';
import { getImpactColor, getImpactLabel, getTeamColor } from '@/lib/utils';
import PressureTimeline from '@/components/PressureTimeline';
import MatchWinProbabilityTimeline from '@/components/MatchWinProbabilityTimeline';

export default function MatchAnalyzerPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const data = useMemo(() => {
    const match = getMatchById(matchId);
    if (!match) return null;
    const impactPlayers = getMatchImpactPlayers(matchId);
    const team1Players = impactPlayers.filter(p => p.team === match.teams[0]);
    const team2Players = impactPlayers.filter(p => p.team === match.teams[1]);
    return { match, impactPlayers, team1Players, team2Players };
  }, [matchId]);

  if (!data) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-4">Match Not Found</h1>
        <Link href="/dashboard" className="text-[#e63946] hover:underline text-sm font-medium transition-colors">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { match, impactPlayers, team1Players, team2Players } = data;
  const team1 = match.teams[0];
  const team2 = match.teams[1];
  const inn1 = match.innings?.find(i => i.battingTeam === team1);
  const inn2 = match.innings?.find(i => i.battingTeam === team2);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Match Header */}
      <div className="fade-in fade-in-1 bg-white border border-black/[0.06] rounded-2xl p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e63946] to-[#ff4d5a]" />
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-[#94a3b8] font-medium">{match.date?.replace(/\//g, '-')}</span>
          <span className="text-xs text-[#b0b8c4]">{match.venue}</span>
        </div>

        <div className="flex items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getTeamColor(team1) }} />
              <span className={`text-xl font-bold tracking-tight ${match.winner === team1 ? 'text-[#e63946]' : 'text-[#1a1a2e]'}`}>
                {team1}
              </span>
            </div>
            {inn1 && (
              <p className="text-2xl font-bold text-[#1a1a2e] ml-6 mt-1">
                {inn1.totalRuns}/{inn1.totalWickets}
                <span className="text-[#94a3b8] text-xs font-normal ml-2">({inn1.overs} ov)</span>
              </p>
            )}
          </div>

          <div className="text-[#cbd5e1] font-bold text-sm tracking-widest">VS</div>

          <div className="flex-1 text-right">
            <div className="flex items-center gap-3 justify-end">
              <span className={`text-xl font-bold tracking-tight ${match.winner === team2 ? 'text-[#e63946]' : 'text-[#1a1a2e]'}`}>
                {team2}
              </span>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getTeamColor(team2) }} />
            </div>
            {inn2 && (
              <p className="text-2xl font-bold text-[#1a1a2e] mr-6 mt-1">
                {inn2.totalRuns}/{inn2.totalWickets}
                <span className="text-[#94a3b8] text-xs font-normal ml-2">({inn2.overs} ov)</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-black/[0.05] flex items-center justify-between">
          <p className="text-sm text-[#64748b]">
            {match.winner && (
              <>
                <span className="text-[#e63946] font-semibold">{match.winner}</span> won
                {match.winnerRuns > 0 && ` by ${match.winnerRuns} runs`}
                {match.winnerWickets > 0 && ` by ${match.winnerWickets} wickets`}
              </>
            )}
          </p>
          {match.playerOfMatch && (
            <p className="text-xs text-[#94a3b8]">
              MVP: <span className="text-[#f59e0b] font-semibold">{match.playerOfMatch}</span>
            </p>
          )}
        </div>
      </div>

      {/* Live Win Probability Added (WPA) & Turning Point */}
      <div className="fade-in fade-in-2 mb-6">
        <MatchWinProbabilityTimeline match={match} impactPlayers={impactPlayers} />
      </div>

      {/* Impact Chart */}
      <div className="fade-in fade-in-2 bg-white border border-black/[0.06] rounded-2xl p-5 mb-6 shadow-sm">
        <PressureTimeline players={impactPlayers.slice(0, 15)} title="Match Impact Leaders" subtitle="Top performers ranked by their impact on this match outcome" />
      </div>

      {/* Team-wise Impact */}
      <div className="fade-in fade-in-3 grid lg:grid-cols-2 gap-4">
        {[
          { team: team1, players: team1Players },
          { team: team2, players: team2Players },
        ].map(({ team, players }) => (
          <div key={team} className="bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/[0.05] relative">
              <div className="absolute top-0 left-0 w-16 h-1 rounded-br-full" style={{ backgroundColor: getTeamColor(team) }} />
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTeamColor(team) }} />
                <h3 className="text-[#1a1a2e] text-sm font-semibold">{team}</h3>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left py-2.5 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">PLAYER</th>
                  <th className="text-center py-2.5 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">ROLE</th>
                  <th className="text-center py-2.5 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">RATING</th>
                  <th className="text-right py-2.5 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">IMPACT</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => {
                  const pData = getPlayerData(p.name);
                  const role = pData?.innings.some(i => i.type === 'bowling') && pData?.innings.some(i => i.type === 'batting') ? 'All-rounder' : pData?.innings.some(i => i.type === 'bowling') ? 'Bowler' : 'Batsman';
                  const label = getImpactLabel(p.impact);

                  return (
                    <tr key={p.name} className="border-b border-black/[0.03] table-row-hover">
                      <td className="py-2.5 px-4">
                        <Link href={`/players/${encodeURIComponent(p.name)}`} className="text-[#475569] text-sm hover:text-[#e63946] transition-colors font-medium">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-center text-xs text-[#94a3b8] capitalize">
                        {role}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: getImpactColor(p.impact) + '15', color: getImpactColor(p.impact) }}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="font-bold text-sm" style={{ color: getImpactColor(p.impact) }}>
                          {p.impact.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
