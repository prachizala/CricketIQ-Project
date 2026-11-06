'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import leaderboardData from '@/data/leaderboard.json';
import { PlayerImpact } from '@/lib/types';
import { getImpactColor, getTeamColor } from '@/lib/utils';

const allPlayers = leaderboardData as unknown as PlayerImpact[];

interface VenuePitchProfile {
  name: string;
  city: string;
  avgFirstInnings: number;
  pitchType: 'Batting Paradise' | 'Spin Friendly' | 'Pace & Bounce' | 'Balanced';
  battingBoost: number; // multiplier e.g. 1.15
  spinBoost: number;
  paceBoost: number;
  tacticalTip: string;
}

const VENUES: VenuePitchProfile[] = [
  {
    name: 'M Chinnaswamy Stadium',
    city: 'Bengaluru',
    avgFirstInnings: 196,
    pitchType: 'Batting Paradise',
    battingBoost: 1.22,
    spinBoost: 0.85,
    paceBoost: 0.95,
    tacticalTip: 'Extremely short boundaries and altitude favor top-order sluggers and death overs hitters. Captain a top-order batter.',
  },
  {
    name: 'MA Chidambaram Stadium (Chepauk)',
    city: 'Chennai',
    avgFirstInnings: 164,
    pitchType: 'Spin Friendly',
    battingBoost: 0.90,
    spinBoost: 1.30,
    paceBoost: 1.05,
    tacticalTip: 'Dry, abrasive surface grips sharply. Mystery spinners and slow ball cutters generate high wicket potential.',
  },
  {
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    avgFirstInnings: 188,
    pitchType: 'Batting Paradise',
    battingBoost: 1.18,
    spinBoost: 0.92,
    paceBoost: 1.12,
    tacticalTip: 'True bounce and heavy evening dew favor chasing sides. Swing bowlers in powerplay and stroke-makers thrive.',
  },
  {
    name: 'Eden Gardens',
    city: 'Kolkata',
    avgFirstInnings: 182,
    pitchType: 'Balanced',
    battingBoost: 1.10,
    spinBoost: 1.12,
    paceBoost: 1.05,
    tacticalTip: 'Even contest between bat and ball with quick outfield. All-rounders who bowl cutters offer best fantasy floors.',
  },
  {
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    avgFirstInnings: 178,
    pitchType: 'Pace & Bounce',
    battingBoost: 1.05,
    spinBoost: 1.02,
    paceBoost: 1.20,
    tacticalTip: 'Long boundaries make six-hitting harder; pacers with hard-length discipline and strike-rotators accumulate reliable points.',
  },
  {
    name: 'Arun Jaitley Stadium',
    city: 'Delhi',
    avgFirstInnings: 190,
    pitchType: 'Batting Paradise',
    battingBoost: 1.16,
    spinBoost: 1.05,
    paceBoost: 0.95,
    tacticalTip: 'Fast pitch with tiny boundaries. Pick aggressive top-3 batters who exploit powerplay restrictions.',
  },
];

const TEAMS = [
  'Chennai Super Kings',
  'Mumbai Indians',
  'Royal Challengers Bangalore',
  'Kolkata Knight Riders',
  'Gujarat Titans',
  'Rajasthan Royals',
  'Delhi Capitals',
  'Sunrisers Hyderabad',
  'Lucknow Super Giants',
  'Punjab Kings',
];

// Map players to specific teams if missing in primary records
const WICKET_KEEPERS = new Set([
  'MS Dhoni', 'RR Pant', 'KL Rahul', 'Q de Kock', 'JC Buttler', 'SV Samson',
  'N Pooran', 'Ishan Kishan', 'WP Saha', 'JM Bairstow', 'KD Karthik', 'H Klaasen',
  'KS Bharat', 'Jitesh Sharma', 'Anuj Rawat', 'Dhruv Jurel', 'Abishek Porel'
]);

interface FantasyPlayer extends PlayerImpact {
  credits: number;
  projectedPoints: number;
  category: 'WK' | 'BAT' | 'AR' | 'BOWL';
  selectedTeam: string;
}

export default function FantasyPredictorPage() {
  const [teamA, setTeamA] = useState<string>('Chennai Super Kings');
  const [teamB, setTeamB] = useState<string>('Mumbai Indians');
  const [selectedVenue, setSelectedVenue] = useState<string>('Wankhede Stadium');
  const [strategy, setStrategy] = useState<'balanced' | 'grandLeague' | 'safeH2H'>('balanced');
  const [selectedPlayerNames, setSelectedPlayerNames] = useState<string[]>([]);
  const [captainName, setCaptainName] = useState<string | null>(null);
  const [viceCaptainName, setViceCaptainName] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const venueProfile = useMemo(() => {
    return VENUES.find(v => v.name === selectedVenue) || VENUES[0];
  }, [selectedVenue]);

  // Generate candidate pool for Team A and Team B
  const candidatePool = useMemo(() => {
    // Collect all players matching team names or top IPL talent
    const poolA = allPlayers.filter(p => p.team === teamA || (p.team && p.team.includes(teamA.split(' ')[0])));
    const poolB = allPlayers.filter(p => p.team === teamB || (p.team && p.team.includes(teamB.split(' ')[0])));

    // If pool is too small because of historical name differences, supplement with top players
    const combined = [...poolA];
    poolB.forEach(p => {
      if (!combined.some(x => x.name === p.name)) combined.push(p);
    });

    if (combined.length < 22) {
      const topPool = allPlayers
        .filter(p => p.matchesPlayed >= 15)
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 30);
      topPool.forEach(p => {
        if (!combined.some(x => x.name === p.name)) combined.push(p);
      });
    }

    return combined.map((player, idx) => {
      // Determine assigned team
      const assignedTeam = player.team === teamA || (idx % 2 === 0) ? teamA : teamB;
      
      // Determine Role
      let cat: 'WK' | 'BAT' | 'AR' | 'BOWL' = 'BAT';
      if (WICKET_KEEPERS.has(player.name)) {
        cat = 'WK';
      } else if (player.role === 'allrounder') {
        cat = 'AR';
      } else if (player.role === 'bowler') {
        cat = 'BOWL';
      } else {
        cat = 'BAT';
      }

      // Base Credits (7.5 to 10.5)
      const credits = Math.round((7.5 + (Math.min(95, Math.max(35, player.impactScore)) - 35) / 60 * 3.0) * 2) / 2;

      // Base Projected Fantasy Points
      let pfp = (player.impactScore * 0.72) + (player.matchesPlayed > 30 ? 6 : 2);
      
      // Role adjustments
      if (cat === 'AR') pfp *= 1.25; // Dual scoring ceiling
      if (cat === 'WK') pfp *= 1.10; // Catch/stumping points

      // Pitch conditions modifier
      if (cat === 'BAT' || cat === 'WK') {
        pfp *= venueProfile.battingBoost;
      } else if (cat === 'BOWL') {
        pfp *= (player.bowlingAvg < 24 ? venueProfile.paceBoost : venueProfile.spinBoost);
      } else if (cat === 'AR') {
        pfp *= ((venueProfile.battingBoost + venueProfile.paceBoost) / 2);
      }

      // Strategy adjustments
      if (strategy === 'grandLeague') {
        // High upside players (strike rate > 140 or bowling strike rate low)
        const volatility = (player.strikeRate > 145 || player.bowlingAvg < 22) ? 1.20 : 0.90;
        pfp *= volatility;
      } else if (strategy === 'safeH2H') {
        // High consistency players
        const consistency = player.matchesPlayed > 40 ? 1.15 : 0.95;
        pfp *= consistency;
      }

      return {
        ...player,
        credits,
        projectedPoints: Math.round(pfp * 10) / 10,
        category: cat,
        selectedTeam: assignedTeam,
      } as FantasyPlayer;
    }).sort((a, b) => b.projectedPoints - a.projectedPoints);
  }, [teamA, teamB, venueProfile, strategy]);

  // Auto-generate optimal 11 using greedy constraint solver
  const autoGenerateXI = () => {
    const sorted = [...candidatePool].sort((a, b) => (b.projectedPoints / b.credits) - (a.projectedPoints / a.credits));
    const selected: FantasyPlayer[] = [];
    let currentCredits = 0;
    const teamCounts: Record<string, number> = { [teamA]: 0, [teamB]: 0 };
    const roleCounts: Record<string, number> = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };

    // 1. Mandatory role picks: 1 WK, 3 BAT, 1 AR, 3 BOWL
    const minRoles: [ 'WK' | 'BAT' | 'AR' | 'BOWL', number ][] = [
      ['WK', 1],
      ['BAT', 3],
      ['AR', 1],
      ['BOWL', 3],
    ];

    for (const [role, minCount] of minRoles) {
      const candidates = sorted.filter(p => p.category === role);
      for (const p of candidates) {
        if (roleCounts[role] < minCount && !selected.some(x => x.name === p.name)) {
          if (currentCredits + p.credits <= 100 && (teamCounts[p.selectedTeam] || 0) < 7) {
            selected.push(p);
            currentCredits += p.credits;
            teamCounts[p.selectedTeam] = (teamCounts[p.selectedTeam] || 0) + 1;
            roleCounts[role]++;
          }
        }
      }
    }

    // 2. Fill remaining 3 slots with highest PFP
    for (const p of sorted) {
      if (selected.length >= 11) break;
      if (selected.some(x => x.name === p.name)) continue;

      if (currentCredits + p.credits <= 100 && (teamCounts[p.selectedTeam] || 0) < 7) {
        // Enforce max bounds
        if (p.category === 'WK' && roleCounts.WK >= 4) continue;
        if (p.category === 'BAT' && roleCounts.BAT >= 6) continue;
        if (p.category === 'AR' && roleCounts.AR >= 4) continue;
        if (p.category === 'BOWL' && roleCounts.BOWL >= 6) continue;

        selected.push(p);
        currentCredits += p.credits;
        teamCounts[p.selectedTeam] = (teamCounts[p.selectedTeam] || 0) + 1;
        roleCounts[p.category]++;
      }
    }

    const finalNames = selected.map(p => p.name);
    setSelectedPlayerNames(finalNames);

    // Pick top 2 as Captain & Vice-Captain
    const sortedByPoints = [...selected].sort((a, b) => b.projectedPoints - a.projectedPoints);
    if (sortedByPoints[0]) setCaptainName(sortedByPoints[0].name);
    if (sortedByPoints[1]) setViceCaptainName(sortedByPoints[1].name);
  };

  // Toggle player selection manually
  const togglePlayer = (player: FantasyPlayer) => {
    if (selectedPlayerNames.includes(player.name)) {
      setSelectedPlayerNames(prev => prev.filter(n => n !== player.name));
      if (captainName === player.name) setCaptainName(null);
      if (viceCaptainName === player.name) setViceCaptainName(null);
    } else {
      if (selectedPlayerNames.length >= 11) return;
      setSelectedPlayerNames(prev => [...prev, player.name]);
    }
  };

  // Current squad summary
  const currentXI = useMemo(() => {
    return candidatePool.filter(p => selectedPlayerNames.includes(p.name));
  }, [candidatePool, selectedPlayerNames]);

  const totalCreditsUsed = useMemo(() => {
    return Math.round(currentXI.reduce((acc, p) => acc + p.credits, 0) * 10) / 10;
  }, [currentXI]);

  const totalProjectedPoints = useMemo(() => {
    return Math.round(currentXI.reduce((acc, p) => {
      let pts = p.projectedPoints;
      if (p.name === captainName) pts *= 2;
      else if (p.name === viceCaptainName) pts *= 1.5;
      return acc + pts;
    }, 0) * 10) / 10;
  }, [currentXI, captainName, viceCaptainName]);

  const teamACount = currentXI.filter(p => p.selectedTeam === teamA).length;
  const teamBCount = currentXI.filter(p => p.selectedTeam === teamB).length;

  const roleCounts = useMemo(() => {
    const counts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
    currentXI.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [currentXI]);

  const handleCopyLineup = () => {
    if (currentXI.length === 0) return;
    const text = `🏏 CricketIQ Smart XI Fantasy Lineup\nMatch: ${teamA} vs ${teamB}\nVenue: ${selectedVenue}\nProjected Points: ${totalProjectedPoints}\nCredits: ${totalCreditsUsed}/100\n\n` +
      currentXI.map((p, idx) => {
        let tag = '';
        if (p.name === captainName) tag = ' (C - 2x)';
        else if (p.name === viceCaptainName) tag = ' (VC - 1.5x)';
        return `${idx + 1}. ${p.name} [${p.category}] - ${p.credits} cr (${p.projectedPoints} PFP)${tag}`;
      }).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a9d8f]/10 text-[#2a9d8f] border border-[#2a9d8f]/20">
              ML Fantasy Engine &middot; Dream11 Ready
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">
            Fantasy Captaincy & Smart XI Predictor
          </h1>
          <p className="text-sm text-[#64748b] mt-1 max-w-2xl">
            Simulate upcoming IPL matches, project venue-adjusted fantasy points, and discover algorithmically optimal Captain (2x) and Vice-Captain (1.5x) picks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={autoGenerateXI}
            className="px-4 py-2 bg-[#e63946] hover:bg-[#d62839] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>⚡ Auto-Generate Smart XI</span>
          </button>
          <button
            onClick={handleCopyLineup}
            disabled={currentXI.length === 0}
            className="px-4 py-2 border border-black/10 hover:border-black/20 text-[#1a1a2e] text-xs font-semibold rounded-lg bg-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Lineup'}
          </button>
        </div>
      </div>

      {/* Match Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Team A */}
        <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
          <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">Team 1</label>
          <select
            value={teamA}
            onChange={(e) => {
              setTeamA(e.target.value);
              setSelectedPlayerNames([]);
            }}
            className="w-full text-sm font-semibold text-[#1a1a2e] bg-slate-50 border border-black/10 rounded-lg p-2.5 outline-none focus:border-[#e63946]"
          >
            {TEAMS.map(t => (
              <option key={t} value={t} disabled={t === teamB}>{t}</option>
            ))}
          </select>
        </div>

        {/* Team B */}
        <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
          <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">Team 2</label>
          <select
            value={teamB}
            onChange={(e) => {
              setTeamB(e.target.value);
              setSelectedPlayerNames([]);
            }}
            className="w-full text-sm font-semibold text-[#1a1a2e] bg-slate-50 border border-black/10 rounded-lg p-2.5 outline-none focus:border-[#e63946]"
          >
            {TEAMS.map(t => (
              <option key={t} value={t} disabled={t === teamA}>{t}</option>
            ))}
          </select>
        </div>

        {/* Venue */}
        <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
          <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">Venue & Conditions</label>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full text-sm font-semibold text-[#1a1a2e] bg-slate-50 border border-black/10 rounded-lg p-2.5 outline-none focus:border-[#e63946]"
          >
            {VENUES.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.city})</option>
            ))}
          </select>
        </div>

        {/* Contest Strategy */}
        <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-sm">
          <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">League Strategy</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setStrategy('balanced')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                strategy === 'balanced' ? 'bg-white text-[#1a1a2e] shadow-xs' : 'text-[#64748b] hover:text-[#1a1a2e]'
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => setStrategy('grandLeague')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                strategy === 'grandLeague' ? 'bg-white text-[#e63946] shadow-xs' : 'text-[#64748b] hover:text-[#1a1a2e]'
              }`}
            >
              Grand League
            </button>
            <button
              onClick={() => setStrategy('safeH2H')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                strategy === 'safeH2H' ? 'bg-white text-[#2a9d8f] shadow-xs' : 'text-[#64748b] hover:text-[#1a1a2e]'
              }`}
            >
              Safe H2H
            </button>
          </div>
        </div>
      </div>

      {/* Pitch Intelligence Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1a1a2e] text-white p-5 rounded-2xl mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-[#e63946] font-bold">Pitch Analytics</span>
              <span className="text-xs text-white/40">&bull;</span>
              <span className="text-xs text-white/70">{venueProfile.name}, {venueProfile.city}</span>
            </div>
            <div className="text-lg font-bold flex items-center gap-2">
              <span>{venueProfile.pitchType}</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                Avg 1st Inn: {venueProfile.avgFirstInnings} runs
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1.5 max-w-2xl leading-relaxed">
              💡 {venueProfile.tacticalTip}
            </p>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-center">
            <div>
              <div className="text-xs text-white/60">Bat Boost</div>
              <div className="text-base font-bold text-emerald-400">+{Math.round((venueProfile.battingBoost - 1) * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-white/60">Spin Boost</div>
              <div className="text-base font-bold text-cyan-400">
                {venueProfile.spinBoost >= 1 ? `+${Math.round((venueProfile.spinBoost - 1) * 100)}%` : `-${Math.round((1 - venueProfile.spinBoost) * 100)}%`}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">Pace Boost</div>
              <div className="text-base font-bold text-rose-400">
                {venueProfile.paceBoost >= 1 ? `+${Math.round((venueProfile.paceBoost - 1) * 100)}%` : `-${Math.round((1 - venueProfile.paceBoost) * 100)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Squad & Lineup Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Player Selection Pool */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a2e]">Candidate Player Pool</h2>
            <span className="text-xs text-[#94a3b8]">Click cards to add or remove from Smart XI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {candidatePool.slice(0, 32).map(player => {
              const isSelected = selectedPlayerNames.includes(player.name);
              const isC = captainName === player.name;
              const isVC = viceCaptainName === player.name;

              return (
                <div
                  key={player.name}
                  onClick={() => togglePlayer(player)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#e63946] bg-[#fef0f1]/40 shadow-xs'
                      : 'border-black/[0.06] bg-white hover:border-black/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#1a1a2e]">{player.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          player.category === 'WK' ? 'bg-amber-100 text-amber-800' :
                          player.category === 'BAT' ? 'bg-blue-100 text-blue-800' :
                          player.category === 'AR' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {player.category}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748b] mt-0.5 flex items-center gap-2">
                        <span style={{ color: getTeamColor(player.selectedTeam) }} className="font-semibold">
                          {player.selectedTeam.split(' ').map(w => w[0]).join('')}
                        </span>
                        <span>&bull;</span>
                        <span>{player.matchesPlayed} matches</span>
                        <span>&bull;</span>
                        <span>Impact: <strong>{player.impactScore}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-[#e63946]">{player.projectedPoints} PFP</div>
                      <div className="text-xs font-semibold text-[#94a3b8]">{player.credits} cr</div>
                    </div>
                  </div>

                  {/* C / VC Controls if selected */}
                  {isSelected && (
                    <div className="mt-3 pt-2.5 border-t border-black/[0.06] flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      <span className="text-[11px] font-medium text-[#64748b]">Multiplier:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (isC) {
                              setCaptainName(null);
                            } else {
                              setCaptainName(player.name);
                              if (isVC) setViceCaptainName(null);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                            isC ? 'bg-[#e63946] text-white shadow-xs' : 'bg-slate-100 text-[#64748b] hover:bg-slate-200'
                          }`}
                        >
                          C (2x)
                        </button>
                        <button
                          onClick={() => {
                            if (isVC) {
                              setViceCaptainName(null);
                            } else {
                              setViceCaptainName(player.name);
                              if (isC) setCaptainName(null);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                            isVC ? 'bg-[#2a9d8f] text-white shadow-xs' : 'bg-slate-100 text-[#64748b] hover:bg-slate-200'
                          }`}
                        >
                          VC (1.5x)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Team Lineup & Live Validation */}
        <div className="space-y-6">
          {/* Squad Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1a1a2e]">Selected Lineup ({currentXI.length}/11)</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                currentXI.length === 11 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {currentXI.length === 11 ? '✓ Complete Squad' : `${11 - currentXI.length} picks needed`}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-black/[0.04]">
              <div>
                <span className="text-[11px] text-[#94a3b8] font-medium block">Credits Left</span>
                <span className={`text-base font-extrabold ${
                  100 - totalCreditsUsed < 0 ? 'text-red-600' : 'text-[#1a1a2e]'
                }`}>
                  {(100 - totalCreditsUsed).toFixed(1)} / 100
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#94a3b8] font-medium block">Total Projected Points</span>
                <span className="text-base font-extrabold text-[#e63946]">
                  {totalProjectedPoints} Pts
                </span>
              </div>
            </div>

            {/* Constraints Checkers */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#64748b]">
                <span>Team Balance ({teamA.split(' ')[0]} / {teamB.split(' ')[0]}):</span>
                <span className="font-bold text-[#1a1a2e]">
                  {teamACount} / {teamBCount} {teamACount > 7 || teamBCount > 7 ? '❌ (Max 7)' : '✓'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#64748b]">
                <span>Roles Breakdown:</span>
                <span className="font-semibold text-[#1a1a2e]">
                  {roleCounts.WK} WK &bull; {roleCounts.BAT} BAT &bull; {roleCounts.AR} AR &bull; {roleCounts.BOWL} BOWL
                </span>
              </div>
            </div>

            {/* Captaincy summary */}
            <div className="border-t border-black/[0.06] pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Captain (2x):</span>
                <span className="font-bold text-[#e63946]">{captainName || 'Not selected'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Vice-Captain (1.5x):</span>
                <span className="font-bold text-[#2a9d8f]">{viceCaptainName || 'Not selected'}</span>
              </div>
            </div>
          </div>

          {/* Lineup List */}
          <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-3">Starting XI Squad</h4>
            {currentXI.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#94a3b8]">
                No players selected yet.<br />Click <strong>Auto-Generate Smart XI</strong> or select players from the pool.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {currentXI.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-black/[0.03] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94a3b8] font-bold w-4">{idx + 1}</span>
                      <span className="font-bold text-[#1a1a2e]">{p.name}</span>
                      {p.name === captainName && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#e63946] text-white">C</span>
                      )}
                      {p.name === viceCaptainName && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#2a9d8f] text-white">VC</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-[#64748b]">{p.credits} cr</span>
                      <span className="text-[#e63946]">{p.projectedPoints} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
