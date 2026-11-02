'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPlayerData } from '@/lib/dataLoader';
import { calculatePlayerImpact, calculateInningsImpact, getRecentForm } from '@/lib/impactEngine';
import { BattingInnings, BowlingInnings } from '@/lib/types';
import ImpactMeter from '@/components/ImpactMeter';
import ImpactChart from '@/components/ImpactChart';
import { getImpactColor, getTeamColor } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '10px',
  color: '#1a1a2e',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

export default function PlayerProfilePage() {
  const params = useParams();
  const playerName = decodeURIComponent(params.playerId as string);

  const profile = useMemo(() => {
    const data = getPlayerData(playerName);
    if (!data) return null;

    const impact = calculatePlayerImpact(playerName, data);
    const form = getRecentForm(data.innings, 10);

    const battingInnings = data.innings
      .filter(i => i.type === 'batting')
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')) as BattingInnings[];

    const bowlingInnings = data.innings
      .filter(i => i.type === 'bowling')
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')) as BowlingInnings[];

    const isBowler = impact.role === 'bowler';
    const primaryInnings = isBowler ? (bowlingInnings as unknown as typeof data.innings) : (battingInnings as unknown as typeof data.innings);

    const performanceData = primaryInnings.slice(0, 15).map((inn, i) => {
      const bd = calculateInningsImpact(inn);
      if (inn.type === 'bowling') {
        const bowl = inn as BowlingInnings;
        return {
          match: `M${i + 1}`,
          impact: Math.round(bd.normalizedImpact * 10) / 10,
          runs: bowl.wickets,
          sr: Math.round(bowl.economy * 10) / 10,
        };
      }
      const bat = inn as BattingInnings;
      return {
        match: `M${i + 1}`,
        impact: Math.round(bd.normalizedImpact * 10) / 10,
        runs: bat.runs,
        sr: Math.round(bat.strikeRate),
      };
    }).reverse();

    let pressureInnings: typeof data.innings;
    let normalInnings: typeof data.innings;

    if (isBowler) {
      pressureInnings = bowlingInnings.filter(i => !i.isChasing || (i.economy < 7 && i.wickets >= 2));
      normalInnings = bowlingInnings.filter(i => i.isChasing && !(i.economy < 7 && i.wickets >= 2));
    } else {
      pressureInnings = battingInnings.filter(i => i.isChasing && i.requiredRunRate > 8);
      normalInnings = battingInnings.filter(i => !i.isChasing || i.requiredRunRate <= 8);
    }

    const pressureAvg = pressureInnings.length > 0
      ? pressureInnings.reduce((s, i) => s + calculateInningsImpact(i).normalizedImpact, 0) / pressureInnings.length
      : 0;
    const normalAvg = normalInnings.length > 0
      ? normalInnings.reduce((s, i) => s + calculateInningsImpact(i).normalizedImpact, 0) / normalInnings.length
      : 0;

    const matchIds = new Set(data.innings.map(i => i.matchId));
    const wins = new Set(data.innings.filter(i => i.matchResult === 'won').map(i => i.matchId)).size;
    const losses = new Set(data.innings.filter(i => i.matchResult === 'lost').map(i => i.matchId)).size;

    const recentBatting = battingInnings.slice(0, 10).map(inn => ({
      matchId: inn.matchId,
      date: inn.date,
      opponent: inn.opponent,
      runs: inn.runs,
      ballsFaced: inn.ballsFaced,
      sr: Math.round(inn.strikeRate),
      impact: Math.round(calculateInningsImpact(inn).normalizedImpact * 10) / 10,
      result: inn.matchResult,
      season: inn.season,
    }));

    const recentBowling = bowlingInnings.slice(0, 10).map(inn => ({
      matchId: inn.matchId,
      date: inn.date,
      opponent: inn.opponent,
      wickets: inn.wickets,
      runsConceded: inn.runsConceded,
      overs: Math.floor(inn.ballsBowled / 6) + (inn.ballsBowled % 6) / 10,
      economy: Math.round(inn.economy * 100) / 100,
      impact: Math.round(calculateInningsImpact(inn).normalizedImpact * 10) / 10,
      result: inn.matchResult,
      season: inn.season,
    }));

    // Generate user-friendly highlights for "Why this score?"
    const highlights: { title: string; desc: string; icon: string }[] = [];

    if (impact.role !== 'bowler') {
      const deathRuns = battingInnings.reduce((s, i) => s + (i.runsInDeath || 0), 0);
      if (deathRuns >= 100) {
        highlights.push({
          title: 'Strong finisher in the last overs',
          desc: `Scored ${deathRuns} runs in the critical closing overs (overs 16–20).`,
          icon: '⚡',
        });
      }
    }

    if (impact.role !== 'batsman') {
      const deathWickets = bowlingInnings.reduce((s, i) => s + (i.wicketsInDeath || 0), 0);
      if (deathWickets >= 8) {
        highlights.push({
          title: 'Death Overs Specialist',
          desc: `Took ${deathWickets} wickets in the closing overs to break late partnerships.`,
          icon: '🎯',
        });
      }
    }

    if (pressureAvg >= 55) {
      highlights.push({
        title: 'Stays calm under pressure',
        desc: `Averages a high ${Math.round(pressureAvg)} rating in tense match situations.`,
        icon: '🔥',
      });
    } else if (pressureAvg > normalAvg && pressureAvg >= 45) {
      highlights.push({
        title: 'Stays calm under pressure',
        desc: `Rates higher in tense chases and tight finishes than in standard situations.`,
        icon: '🔥',
      });
    }

    if (form.length >= 5) {
      const avg = form.reduce((a, b) => a + b, 0) / form.length;
      const variance = form.reduce((s, v) => s + (v - avg) ** 2, 0) / form.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev <= 14 && avg >= 48) {
        highlights.push({
          title: 'Consistent in Recent Matches',
          desc: `Maintains reliable, dependable ratings across recent performances.`,
          icon: '📈',
        });
      }
    }

    const knockoutInnings = data.innings.filter(i => i.isKnockout);
    if (knockoutInnings.length > 0) {
      const koImpacts = knockoutInnings.map(i => calculateInningsImpact(i).normalizedImpact);
      const koAvg = koImpacts.reduce((a, b) => a + b, 0) / koImpacts.length;
      if (koAvg >= 52) {
        highlights.push({
          title: 'Performs in big matches',
          desc: `Elevates impact in playoff and knockout matches with an average rating of ${Math.round(koAvg)}.`,
          icon: '🏆',
        });
      }
    }

    if (impact.role !== 'bowler' && impact.strikeRate >= 140 && impact.matchesPlayed >= 8) {
      highlights.push({
        title: 'High Strike Rate Impact',
        desc: `Scoring speed of ${impact.strikeRate.toFixed(1)} strike rate shifts game momentum rapidly.`,
        icon: '🚀',
      });
    }

    if (impact.role !== 'batsman' && impact.economy <= 7.8 && impact.economy > 0 && impact.matchesPlayed >= 8) {
      highlights.push({
        title: 'Disciplined Economy',
        desc: `Restricts opposing batsmen with an economical ${impact.economy.toFixed(1)} run rate.`,
        icon: '🔒',
      });
    }

    if (impact.winRate >= 54 && impact.matchesPlayed >= 12) {
      highlights.push({
        title: 'Strong Match-Winning Influence',
        desc: `Associated with team victory — team has won ${impact.winRate.toFixed(0)}% of matches played.`,
        icon: '🎖️',
      });
    }

    if (highlights.length < 3) {
      if (impact.impactScore >= 60) {
        highlights.push({
          title: 'Decisive Match-Winner',
          desc: `Regularly turns matches with high-impact batting and bowling efforts.`,
          icon: '⭐',
        });
      } else {
        highlights.push({
          title: 'Reliable Lineup Contributor',
          desc: `Provides vital team balance and steady contributions in all match conditions.`,
          icon: '🏏',
        });
      }
    }

    return {
      impact, form, battingInnings, bowlingInnings, performanceData,
      pressureAvg: Math.round(pressureAvg * 10) / 10,
      normalAvg: Math.round(normalAvg * 10) / 10,
      pressureCount: pressureInnings.length,
      wins, losses, totalMatches: matchIds.size,
      recentBatting, recentBowling,
      highlights: highlights.slice(0, 4),
    };
  }, [playerName]);

  if (!profile) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-4">Player Not Found</h1>
        <p className="text-[#64748b] mb-6 text-sm">Could not find data for &quot;{playerName}&quot;</p>
        <Link href="/leaderboard" className="text-[#e63946] hover:underline text-sm font-medium transition-colors">
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const { impact } = profile;
  const teamColor = getTeamColor(impact.team);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Player Header */}
      <div className="fade-in fade-in-1 bg-white border border-black/[0.06] rounded-2xl p-6 mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-1 rounded-br-full" style={{ backgroundColor: teamColor }} />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: teamColor + '15', color: teamColor, border: `2px solid ${teamColor}30` }}
          >
            {impact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] tracking-tight">{impact.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: teamColor + '12', color: teamColor }}>
                {impact.role}
              </span>
            </div>
            <p className="text-sm text-[#94a3b8]">{impact.team}</p>
          </div>

          <div className="flex items-center gap-8 self-center md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-black/[0.05] w-full md:w-auto justify-around md:justify-end">
            <div className="text-center">
              <ImpactMeter score={impact.impactScore} size="md" />
              <p className="text-xs text-[#94a3b8] font-medium mt-1">Impact Rating</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-black/[0.05]">
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Matches</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.matchesPlayed}</p>
          </div>
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Batting Avg</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.battingAvg > 0 ? impact.battingAvg.toFixed(1) : '-'}</p>
          </div>
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Strike Rate</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.strikeRate > 0 ? impact.strikeRate.toFixed(1) : '-'}</p>
          </div>
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Bowling Avg</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.bowlingAvg < 100 && impact.bowlingAvg > 0 ? impact.bowlingAvg.toFixed(1) : '-'}</p>
          </div>
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Economy</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.economy > 0 ? impact.economy.toFixed(1) : '-'}</p>
          </div>
          <div className="bg-[#fafafa] rounded-xl p-3 text-center">
            <p className="text-xs text-[#94a3b8] font-medium">Team Win %</p>
            <p className="text-lg font-bold text-[#1a1a2e] mt-0.5">{impact.winRate.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* "Why this score?" Friendly Highlights Section */}
      <div className="fade-in fade-in-2 bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            PERFORMANCE HIGHLIGHTS
          </span>
          <h2 className="text-base font-bold text-[#1a1a2e]">Why this score?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile.highlights.map(h => (
            <div key={h.title} className="bg-[#fafafa] border border-black/[0.04] rounded-xl p-4">
              <div className="text-2xl mb-2">{h.icon}</div>
              <h3 className="text-sm font-semibold text-[#1a1a2e] mb-1">{h.title}</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Trend + Match Impact */}
      <div className="fade-in fade-in-3 grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">Recent Form Trajectory</h3>
          <p className="text-[#94a3b8] text-xs mb-4">Rating trend across last 10 innings</p>
          <ImpactChart data={profile.form} height={280} />
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">
            {impact.role === 'bowler' ? 'Recent Bowling Impact' : 'Recent Match Impact'}
          </h3>
          <p className="text-[#94a3b8] text-xs mb-4">Recent individual match ratings</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profile.performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="match" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#1a1a2e' }} labelStyle={{ color: '#64748b' }} cursor={{ fill: 'rgba(230,57,70,0.04)' }} formatter={(value: any) => value != null ? [Number(value).toFixed(1), 'Impact'] : ['', '']} />
              <Bar dataKey="impact" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {profile.performanceData.map((entry, index) => (
                  <Cell key={index} fill={getImpactColor(entry.impact)} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Situational Performance + Results */}
      <div className="fade-in fade-in-4 grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-5">Situational Performance</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#475569] text-xs font-medium">
                  {impact.role === 'bowler' ? 'Defending Low Totals' : 'Chasing Under Pressure (High Run Rate)'}
                </span>
                <span className="text-[#1a1a2e] font-bold text-sm">{profile.pressureAvg}</span>
              </div>
              <div className="w-full h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${profile.pressureAvg}%`, backgroundColor: getImpactColor(profile.pressureAvg) }} />
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">{profile.pressureCount} matches analyzed</p>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#475569] text-xs font-medium">
                  {impact.role === 'bowler' ? 'Standard Bowling Conditions' : 'Standard Batting Conditions'}
                </span>
                <span className="text-[#1a1a2e] font-bold text-sm">{profile.normalAvg}</span>
              </div>
              <div className="w-full h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${profile.normalAvg}%`, backgroundColor: getImpactColor(profile.normalAvg) }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <h3 className="text-[#1a1a2e] text-sm font-semibold mb-4">Match Results</h3>
          <div className="flex items-center gap-8 justify-center">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={[{ name: 'Wins', value: profile.wins }, { name: 'Losses', value: profile.losses }]} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  <Cell fill="#e63946" fillOpacity={0.8} />
                  <Cell fill="#ef4444" fillOpacity={0.5} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#e63946]/80" />
                <span className="text-[#475569] text-sm">Wins: <span className="text-[#1a1a2e] font-semibold">{profile.wins}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="text-[#475569] text-sm">Losses: <span className="text-[#1a1a2e] font-semibold">{profile.losses}</span></span>
              </div>
              <div className="text-xs text-[#94a3b8] mt-2">
                Total: {profile.totalMatches} matches
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batting Innings — shown for batsmen and all-rounders */}
      {impact.role !== 'bowler' && profile.recentBatting.length > 0 && (
        <div className="fade-in fade-in-5 bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-black/[0.05]">
            <h3 className="text-[#1a1a2e] text-sm font-semibold">Recent Batting Matches</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">DATE</th>
                  <th className="text-left py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">OPPONENT</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">RUNS</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">BALLS</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">STRIKE RATE</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">IMPACT</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {profile.recentBatting.map((m, i) => (
                  <tr key={i} className="border-b border-black/[0.03] table-row-hover">
                    <td className="py-3 px-4 text-[#94a3b8] text-xs">{m.date?.replace(/\//g, '-')}</td>
                    <td className="py-3 px-4 text-[#475569] text-sm font-medium">{m.opponent}</td>
                    <td className="py-3 px-4 text-center text-[#1a1a2e] font-bold text-sm">{m.runs}</td>
                    <td className="py-3 px-4 text-center text-[#64748b] text-sm">{m.ballsFaced}</td>
                    <td className="py-3 px-4 text-center text-[#64748b] text-sm">{m.sr}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-sm" style={{ color: getImpactColor(m.impact) }}>{m.impact}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${m.result === 'won' ? 'text-[#e63946] bg-[#fef0f1]' : 'text-[#ef4444] bg-[#fef2f2]'}`}>
                        {m.result === 'won' ? 'Won' : 'Lost'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bowling Innings — shown for bowlers and all-rounders */}
      {impact.role !== 'batsman' && profile.recentBowling.length > 0 && (
        <div className="fade-in fade-in-6 bg-white border border-black/[0.06] rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-black/[0.05]">
            <h3 className="text-[#1a1a2e] text-sm font-semibold">Recent Bowling Matches</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  <th className="text-left py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">DATE</th>
                  <th className="text-left py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">OPPONENT</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">WICKETS</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">RUNS</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">OVERS</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">ECONOMY</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">IMPACT</th>
                  <th className="text-center py-3 px-4 text-xs text-[#94a3b8] font-semibold tracking-wider">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {profile.recentBowling.map((m, i) => (
                  <tr key={i} className="border-b border-black/[0.03] table-row-hover">
                    <td className="py-3 px-4 text-[#94a3b8] text-xs">{m.date?.replace(/\//g, '-')}</td>
                    <td className="py-3 px-4 text-[#475569] text-sm font-medium">{m.opponent}</td>
                    <td className="py-3 px-4 text-center text-[#1a1a2e] font-bold text-sm">{m.wickets}</td>
                    <td className="py-3 px-4 text-center text-[#64748b] text-sm">{m.runsConceded}</td>
                    <td className="py-3 px-4 text-center text-[#64748b] text-sm">{m.overs}</td>
                    <td className="py-3 px-4 text-center text-[#64748b] text-sm">{m.economy}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-sm" style={{ color: getImpactColor(m.impact) }}>{m.impact}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${m.result === 'won' ? 'text-[#e63946] bg-[#fef0f1]' : 'text-[#ef4444] bg-[#fef2f2]'}`}>
                        {m.result === 'won' ? 'Won' : 'Lost'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
