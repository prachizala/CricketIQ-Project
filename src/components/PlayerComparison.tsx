'use client';

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend,
} from 'recharts';
import { PlayerImpact } from '@/lib/types';
import ImpactMeter from './ImpactMeter';

interface PlayerComparisonProps {
  player1: PlayerImpact;
  player2: PlayerImpact;
}

export default function PlayerComparison({ player1, player2 }: PlayerComparisonProps) {
  const normalize = (val: number, max: number) => Math.min(100, (val / max) * 100);

  const radarData = [
    { metric: 'Impact', [player1.name]: player1.impactScore, [player2.name]: player2.impactScore },
    { metric: 'Strike Rate', [player1.name]: normalize(player1.strikeRate, 200), [player2.name]: normalize(player2.strikeRate, 200) },
    { metric: 'Win Rate', [player1.name]: player1.winRate, [player2.name]: player2.winRate },
    { metric: 'Consistency', [player1.name]: getConsistency(player1.recentForm), [player2.name]: getConsistency(player2.recentForm) },
    { metric: 'Experience', [player1.name]: normalize(player1.matchesPlayed, 200), [player2.name]: normalize(player2.matchesPlayed, 200) },
    { metric: 'Batting Avg', [player1.name]: normalize(player1.battingAvg, 60), [player2.name]: normalize(player2.battingAvg, 60) },
  ];

  return (
    <div>
      {/* Side by side meters */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="text-center">
          <h3 className="text-[#1a1a2e] font-semibold text-sm mb-0.5">{player1.name}</h3>
          <p className="text-xs text-[#94a3b8] mb-4">{player1.team}</p>
          <ImpactMeter score={player1.impactScore} size="md" />
        </div>
        <div className="text-center">
          <h3 className="text-[#1a1a2e] font-semibold text-sm mb-0.5">{player2.name}</h3>
          <p className="text-xs text-[#94a3b8] mb-4">{player2.team}</p>
          <ImpactMeter score={player2.impactScore} size="md" />
        </div>
      </div>

      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(0,0,0,0.06)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name={player1.name} dataKey={player1.name} stroke="#e63946" fill="#e63946" fillOpacity={0.1} strokeWidth={2} strokeOpacity={0.8} />
          <Radar name={player2.name} dataKey={player2.name} stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} strokeOpacity={0.8} />
          <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Stats table */}
      <div className="mt-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="py-2.5 px-3 text-left text-xs text-[#94a3b8] font-semibold tracking-wider">METRIC</th>
              <th className="py-2.5 px-3 text-center text-xs text-[#e63946] font-semibold">{player1.name.split(' ').pop()}</th>
              <th className="py-2.5 px-3 text-center text-xs text-[#6366f1] font-semibold">{player2.name.split(' ').pop()}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Impact Score', player1.impactScore.toFixed(1), player2.impactScore.toFixed(1)],
              ['Matches Played', player1.matchesPlayed.toString(), player2.matchesPlayed.toString()],
              ['Strike Rate', player1.strikeRate.toFixed(1), player2.strikeRate.toFixed(1)],
              ['Batting Average', player1.battingAvg.toFixed(1), player2.battingAvg.toFixed(1)],
              ['Economy Rate', player1.economy > 0 ? player1.economy.toFixed(1) : '-', player2.economy > 0 ? player2.economy.toFixed(1) : '-'],
              ['Team Win Rate', `${player1.winRate.toFixed(0)}%`, `${player2.winRate.toFixed(0)}%`],
              ['Player Role', player1.role, player2.role],
            ].map(([label, v1, v2]) => (
              <tr key={label} className="border-b border-black/[0.04] table-row-hover">
                <td className="py-2.5 px-3 text-[#64748b] text-[13px]">{label}</td>
                <td className="py-2.5 px-3 text-center text-[#1a1a2e] text-sm font-semibold">{v1}</td>
                <td className="py-2.5 px-3 text-center text-[#1a1a2e] text-sm font-semibold">{v2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getConsistency(form: number[]): number {
  if (form.length < 2) return 50;
  const avg = form.reduce((a, b) => a + b, 0) / form.length;
  const variance = form.reduce((s, v) => s + (v - avg) ** 2, 0) / form.length;
  return Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));
}
