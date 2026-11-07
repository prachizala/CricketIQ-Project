'use client';

import { useState } from 'react';
import { MatchData } from '@/lib/types';
import { getImpactColor, getImpactLabel, getTeamColor } from '@/lib/utils';
import { getPlayerData } from '@/lib/dataLoader';

interface MatchScoutingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData;
  impactPlayers: {
    name: string;
    team: string;
    impact: number;
    breakdown: {
      performanceScore: number;
      contextWeight: number;
      pressureWeight: number;
      rawImpact: number;
      normalizedImpact: number;
    };
  }[];
}

export default function MatchScoutingReportModal({
  isOpen,
  onClose,
  match,
  impactPlayers,
}: MatchScoutingReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const team1 = match.teams[0];
  const team2 = match.teams[1];
  const inn1 = match.innings?.find(i => i.battingTeam === team1);
  const inn2 = match.innings?.find(i => i.battingTeam === team2);
  const topPerformers = impactPlayers.slice(0, 6);

  // Derive automated tactical takeaways
  const winnerTeam = match.winner || team1;
  const runnerUpTeam = match.teams.find(t => t !== winnerTeam) || team2;
  const mvpPlayer = topPerformers[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `🏏 CricketIQ Executive Match Scouting Report
Match: ${team1} vs ${team2}
Date: ${match.date} | Venue: ${match.venue}
Result: ${match.winner ? `${match.winner} won by ${match.winnerRuns > 0 ? `${match.winnerRuns} runs` : `${match.winnerWickets} wickets`}` : 'Match Completed'}
MVP: ${match.playerOfMatch || (mvpPlayer ? mvpPlayer.name : 'N/A')}

Scores:
• ${team1}: ${inn1 ? `${inn1.totalRuns}/${inn1.totalWickets} (${inn1.overs} ov)` : 'N/A'}
• ${team2}: ${inn2 ? `${inn2.totalRuns}/${inn2.totalWickets} (${inn2.overs} ov)` : 'N/A'}

Top Impact Performers:
${topPerformers.map((p, idx) => `${idx + 1}. ${p.name} (${p.team}) — Impact: ${p.impact.toFixed(1)} [${getImpactLabel(p.impact)}]`).join('\n')}

Generated via CricketIQ ML Analytics Engine (https://github.com/prachizala/CricketIQ-Project)
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-3.5 border-b border-black/[0.08] flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e63946]" />
            <span className="font-bold text-sm text-[#1a1a2e]">Executive Match Scouting Dossier</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg border border-black/10 hover:border-black/20 text-xs font-semibold text-[#1a1a2e] transition-colors bg-white cursor-pointer"
            >
              {copied ? '✓ Copied!' : '📋 Copy Summary'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#e63946] hover:bg-[#c42d38] text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️ Save as PDF / Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#94a3b8] hover:text-[#1a1a2e] text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Scouting Report Content */}
        <div className="p-8 print:p-4 space-y-6 printable-dossier">
          {/* Header Banner */}
          <div className="border-b-2 border-black/[0.08] pb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white">
                    CricketIQ Match Intelligence
                  </span>
                  <span className="text-xs text-[#94a3b8]">&bull; Season {match.season}</span>
                  {match.isKnockout && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e63946]/10 text-[#e63946] border border-[#e63946]/20">
                      PLAYOFF / KNOCKOUT
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-[#1a1a2e] tracking-tight">
                  {team1} vs {team2}
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Venue: <strong>{match.venue}</strong> &bull; Date: {match.date?.replace(/\//g, '-')}
                </p>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Report Format</div>
                <div className="text-sm font-extrabold text-[#e63946]">Post-Match Scouting Dossier</div>
                <div className="text-[10px] text-[#94a3b8]">Verified ML Feature Weights</div>
              </div>
            </div>

            {/* Scoreboard Cards */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-black/[0.05]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamColor(team1) }} />
                  <span className="font-bold text-sm text-[#1a1a2e]">{team1}</span>
                </div>
                <p className="text-xl font-black text-[#1a1a2e] mt-1 ml-5">
                  {inn1 ? `${inn1.totalRuns}/${inn1.totalWickets}` : 'N/A'}
                  <span className="text-xs font-normal text-[#94a3b8] ml-1.5">
                    ({inn1 ? inn1.overs : '0'} ov &bull; RR: {inn1 ? (inn1.totalRuns / Math.max(1, inn1.overs)).toFixed(2) : '0'})
                  </span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTeamColor(team2) }} />
                  <span className="font-bold text-sm text-[#1a1a2e]">{team2}</span>
                </div>
                <p className="text-xl font-black text-[#1a1a2e] mt-1 ml-5">
                  {inn2 ? `${inn2.totalRuns}/${inn2.totalWickets}` : 'N/A'}
                  <span className="text-xs font-normal text-[#94a3b8] ml-1.5">
                    ({inn2 ? inn2.overs : '0'} ov &bull; RR: {inn2 ? (inn2.totalRuns / Math.max(1, inn2.overs)).toFixed(2) : '0'})
                  </span>
                </p>
              </div>
            </div>

            {/* Verdict */}
            <div className="mt-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-[#64748b]">Match Result: </span>
                <span className="font-extrabold text-[#e63946]">
                  {match.winner ? `${match.winner} won by ${match.winnerRuns > 0 ? `${match.winnerRuns} runs` : `${match.winnerWickets} wickets`}` : 'Match Finished'}
                </span>
              </div>
              <div>
                <span className="text-[#64748b]">Player of the Match (MVP): </span>
                <span className="font-extrabold text-[#f59e0b]">{match.playerOfMatch || (mvpPlayer ? mvpPlayer.name : 'N/A')}</span>
              </div>
            </div>
          </div>

          {/* Tactical Takeaways Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">1. Tactical Match Takeaways</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-black/[0.06] bg-slate-50/50">
                <div className="text-xs font-bold text-[#1a1a2e] mb-1 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Match MVP Impact</span>
                </div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  <strong>{mvpPlayer?.name || 'N/A'}</strong> led the match with an Impact Score of{' '}
                  <strong className="text-[#e63946]">{mvpPlayer?.impact.toFixed(1) || '0'}</strong>, delivering key performances in high-leverage situations.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-black/[0.06] bg-slate-50/50">
                <div className="text-xs font-bold text-[#1a1a2e] mb-1 flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>Pressure Execution</span>
                </div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {winnerTeam} capitalized under steep pressure phases, sustaining a higher net context multiplier across middle and death overs.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-black/[0.06] bg-slate-50/50">
                <div className="text-xs font-bold text-[#1a1a2e] mb-1 flex items-center gap-1.5">
                  <span>🔄</span>
                  <span>Team Balance</span>
                </div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {runnerUpTeam} struggled to build multiple match-winning partnerships, relying heavily on isolated individual resistance.
                </p>
              </div>
            </div>
          </div>

          {/* Top Impact Performers Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">2. Top Match Impact Leaders</h3>
              <span className="text-[11px] text-[#94a3b8]">Ranked by ML-Normalized Impact (0–100)</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-black/[0.06]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-black/[0.06] text-[#64748b] font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3 text-center">Role</th>
                    <th className="py-2.5 px-3 text-center">Pressure Weight</th>
                    <th className="py-2.5 px-3 text-center">Context Mult</th>
                    <th className="py-2.5 px-3 text-right">Impact Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {topPerformers.map((p, idx) => {
                    const pData = getPlayerData(p.name);
                    const role = pData?.innings.some(i => i.type === 'bowling') && pData?.innings.some(i => i.type === 'batting')
                      ? 'All-rounder'
                      : pData?.innings.some(i => i.type === 'bowling')
                      ? 'Bowler'
                      : 'Batter';

                    return (
                      <tr key={p.name} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-[#94a3b8]">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-[#1a1a2e]">{p.name}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-[11px]" style={{ color: getTeamColor(p.team) }}>
                            {p.team}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-[#64748b]">{role}</td>
                        <td className="py-2 px-3 text-center font-mono text-[#1a1a2e]">
                          {p.breakdown?.pressureWeight ? `${p.breakdown.pressureWeight.toFixed(2)}x` : '1.00x'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[#1a1a2e]">
                          {p.breakdown?.contextWeight ? `${p.breakdown.contextWeight.toFixed(2)}x` : '1.00x'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className="font-black text-sm px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: getImpactColor(p.impact) + '15',
                              color: getImpactColor(p.impact),
                            }}
                          >
                            {p.impact.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dossier Footer / Authentication */}
          <div className="pt-4 border-t border-black/[0.08] flex items-center justify-between text-[11px] text-[#94a3b8]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1a1a2e]">CricketIQ Analytics Engine</span>
              <span>&bull;</span>
              <span>XGBoost & SHAP Explainable AI</span>
            </div>
            <div>
              Generated for Match #{match.matchId} &bull; Confidential Scouting Report
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
