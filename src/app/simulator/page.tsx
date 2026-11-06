'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { calculateInningsImpact } from '@/lib/impactEngine';
import { BattingInnings, BowlingInnings } from '@/lib/types';
import ImpactMeter from '@/components/ImpactMeter';
import { getImpactColor, getImpactLabel } from '@/lib/utils';

interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  type: 'batting' | 'bowling';
  target: number;
  runsNeeded: number;
  oversRemaining: number;
  wicketsRemaining: number;
  isKnockout: boolean;
  phase: 'powerplay' | 'middle' | 'death';
  playerStats: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    wickets?: number;
    oversBowled?: number;
    runsConceded?: number;
    dotBalls?: number;
  };
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'rinku_chase',
    title: 'Rinku Singh Crisis Miracle',
    subtitle: 'Chasing 29 off the final over with only lower order in hand',
    tag: 'Extreme Pressure',
    type: 'batting',
    target: 205,
    runsNeeded: 29,
    oversRemaining: 1,
    wicketsRemaining: 3,
    isKnockout: false,
    phase: 'death',
    playerStats: { runs: 48, balls: 21, fours: 1, sixes: 6 },
  },
  {
    id: 'jadeja_final',
    title: 'Ravindra Jadeja IPL 2023 Final',
    subtitle: '10 needed off last 2 balls in a rain-reduced championship final',
    tag: 'Championship Final',
    type: 'batting',
    target: 171,
    runsNeeded: 10,
    oversRemaining: 0.5,
    wicketsRemaining: 5,
    isKnockout: true,
    phase: 'death',
    playerStats: { runs: 15, balls: 6, fours: 1, sixes: 1 },
  },
  {
    id: 'bumrah_defense',
    title: 'Jasprit Bumrah Defending Low Total',
    subtitle: 'Defending 148 in IPL Final with pinpoint yorkers',
    tag: 'Bowler Defense',
    type: 'bowling',
    target: 149,
    runsNeeded: 18,
    oversRemaining: 2,
    wicketsRemaining: 4,
    isKnockout: true,
    phase: 'death',
    playerStats: { wickets: 2, oversBowled: 4, runsConceded: 14, dotBalls: 13 },
  },
  {
    id: 'kohli_mcg',
    title: 'Virat Kohli Chase Masterclass',
    subtitle: 'Rebuilding from 31/4 chasing 160 under sky-high pressure',
    tag: 'Anchor & Accelerate',
    type: 'batting',
    target: 160,
    runsNeeded: 48,
    oversRemaining: 3,
    wicketsRemaining: 4,
    isKnockout: false,
    phase: 'death',
    playerStats: { runs: 82, balls: 53, fours: 6, sixes: 4 },
  },
];

export default function SimulatorPage() {
  const [role, setRole] = useState<'batting' | 'bowling'>('batting');

  // Match Situation State
  const [target, setTarget] = useState<number>(180);
  const [runsNeeded, setRunsNeeded] = useState<number>(45);
  const [oversRemaining, setOversRemaining] = useState<number>(4);
  const [wicketsRemaining, setWicketsRemaining] = useState<number>(4);
  const [isKnockout, setIsKnockout] = useState<boolean>(false);
  const [phase, setPhase] = useState<'powerplay' | 'middle' | 'death'>('death');

  // Batting Sliders
  const [runs, setRuns] = useState<number>(45);
  const [ballsFaced, setBallsFaced] = useState<number>(24);
  const [fours, setFours] = useState<number>(4);
  const [sixes, setSixes] = useState<number>(3);

  // Bowling Sliders
  const [wickets, setWickets] = useState<number>(3);
  const [oversBowled, setOversBowled] = useState<number>(4);
  const [runsConceded, setRunsConceded] = useState<number>(24);
  const [dotBalls, setDotBalls] = useState<number>(12);

  // Load Preset
  const applyPreset = (preset: PresetScenario) => {
    setRole(preset.type);
    setTarget(preset.target);
    setRunsNeeded(preset.runsNeeded);
    setOversRemaining(preset.oversRemaining);
    setWicketsRemaining(preset.wicketsRemaining);
    setIsKnockout(preset.isKnockout);
    setPhase(preset.phase);

    if (preset.type === 'batting' && preset.playerStats.runs !== undefined) {
      setRuns(preset.playerStats.runs);
      setBallsFaced(preset.playerStats.balls || 20);
      setFours(preset.playerStats.fours || 2);
      setSixes(preset.playerStats.sixes || 1);
    } else if (preset.type === 'bowling' && preset.playerStats.wickets !== undefined) {
      setWickets(preset.playerStats.wickets);
      setOversBowled(preset.playerStats.oversBowled || 4);
      setRunsConceded(preset.playerStats.runsConceded || 25);
      setDotBalls(preset.playerStats.dotBalls || 10);
    }
  };

  // Calculated RRR & Live Win Probability estimate
  const requiredRunRate = useMemo(() => {
    if (oversRemaining <= 0) return 36;
    return Math.max(0, Math.round((runsNeeded / oversRemaining) * 10) / 10);
  }, [runsNeeded, oversRemaining]);

  const winProbability = useMemo(() => {
    // Basic logistic win prob based on RRR & wickets in hand
    const parRRR = 8.5;
    const rrrDelta = parRRR - requiredRunRate;
    const wicketWeight = (wicketsRemaining - 5) * 0.35;
    const logit = 0.45 * rrrDelta + wicketWeight;
    const prob = Math.round((1 / (1 + Math.exp(-logit))) * 100);
    return Math.max(2, Math.min(98, prob));
  }, [requiredRunRate, wicketsRemaining]);

  // Current Simulated Impact
  const impactAnalysis = useMemo(() => {
    const balls = Math.max(1, ballsFaced);
    const sr = Math.round((runs / balls) * 100);
    const bowlingBalls = Math.round(oversBowled * 6);
    const eco = oversBowled > 0 ? Math.round((runsConceded / oversBowled) * 10) / 10 : 8;

    let innings: BattingInnings | BowlingInnings;

    if (role === 'batting') {
      innings = {
        type: 'batting',
        runs,
        ballsFaced: balls,
        strikeRate: sr,
        fours,
        sixes,
        isOut: false,
        isChasing: true,
        requiredRunRate,
        wicketsRemaining,
        runsInPowerplay: phase === 'powerplay' ? runs : 0,
        runsInMiddle: phase === 'middle' ? runs : 0,
        runsInDeath: phase === 'death' ? runs : 0,
        ballsInPowerplay: phase === 'powerplay' ? balls : 0,
        ballsInMiddle: phase === 'middle' ? balls : 0,
        ballsInDeath: phase === 'death' ? balls : 0,
        isKnockout,
        firstInningsTotal: target,
        opponent: 'Opposition',
        matchResult: 'won',
        season: '2024',
        date: '2024-05-25',
        matchId: 'sim_001',
      };
    } else {
      innings = {
        type: 'bowling',
        wickets,
        runsConceded,
        ballsBowled: bowlingBalls,
        dotBalls,
        economy: eco,
        isChasing: false,
        wicketsInDeath: phase === 'death' ? wickets : 0,
        ballsInDeath: phase === 'death' ? bowlingBalls : 0,
        isKnockout,
        firstInningsTotal: target - runsNeeded,
        opponent: 'Opposition',
        matchResult: 'won',
        season: '2024',
        date: '2024-05-25',
        matchId: 'sim_002',
      };
    }

    const currentImpact = calculateInningsImpact(innings);

    // Baseline "No Pressure" counterfactual comparison
    // What if the exact same performance happened in 1st innings of a league game with standard RRR?
    const baselineInnings: BattingInnings | BowlingInnings = role === 'batting'
      ? {
          ...(innings as BattingInnings),
          isChasing: false,
          requiredRunRate: 0,
          wicketsRemaining: 10,
          isKnockout: false,
          runsInDeath: 0,
          ballsInDeath: 0,
          runsInMiddle: runs,
          ballsInMiddle: balls,
        }
      : {
          ...(innings as BowlingInnings),
          isChasing: true,
          isKnockout: false,
          wicketsInDeath: 0,
          ballsInDeath: 0,
          firstInningsTotal: 0,
        };

    const baselineImpact = calculateInningsImpact(baselineInnings);
    const deltaImpact = Math.round((currentImpact.normalizedImpact - baselineImpact.normalizedImpact) * 10) / 10;

    return {
      current: currentImpact,
      baseline: baselineImpact,
      delta: deltaImpact,
      sr,
      eco,
    };
  }, [role, runs, ballsFaced, fours, sixes, wickets, oversBowled, runsConceded, dotBalls, target, runsNeeded, requiredRunRate, wicketsRemaining, phase, isKnockout]);

  const scoreLabel = getImpactLabel(impactAnalysis.current.normalizedImpact);
  const scoreColor = getImpactColor(impactAnalysis.current.normalizedImpact);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-left">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            WHAT-IF ENGINE &middot; SCENARIO SIMULATOR
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Counterfactual Match Simulator</h1>
        <p className="text-[#94a3b8] text-sm mt-1 max-w-2xl">
          Tweak pressure, wickets in hand, match phase, and championship stakes in real time to see how the exact same performance gains or loses impact.
        </p>
      </div>

      {/* Preset Scenarios Carousel */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase mb-3">
          1-Click Famous Scenarios:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="text-left bg-white border border-black/[0.06] rounded-2xl p-4 hover:border-[#e63946]/40 hover:shadow-md transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef0f1] text-[#e63946]">
                  {preset.tag}
                </span>
                <span className="text-[11px] text-[#94a3b8] capitalize">{preset.type}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#1a1a2e] group-hover:text-[#e63946] transition-colors leading-snug">
                {preset.title}
              </h4>
              <p className="text-xs text-[#64748b] mt-1 line-clamp-2">
                {preset.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Role & Match Stakes Toggle */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4 flex items-center justify-between">
              <span>1. Match Context &amp; Stakes</span>
              <span className="text-xs font-normal text-[#94a3b8]">Defines Pressure Multipliers</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs text-[#94a3b8] font-semibold block mb-2">SIMULATE ROLE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRole('batting')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === 'batting'
                        ? 'bg-[#e63946] text-white border-[#e63946] shadow-sm'
                        : 'bg-[#fafafa] text-[#64748b] border-black/[0.06] hover:bg-black/[0.02]'
                    }`}
                  >
                    🏏 Batting
                  </button>
                  <button
                    onClick={() => setRole('bowling')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === 'bowling'
                        ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-sm'
                        : 'bg-[#fafafa] text-[#64748b] border-black/[0.06] hover:bg-black/[0.02]'
                    }`}
                  >
                    🎳 Bowling
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94a3b8] font-semibold block mb-2">MATCH GRAVITY</label>
                <button
                  onClick={() => setIsKnockout(!isKnockout)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isKnockout
                      ? 'bg-[#fef9ee] text-[#d97706] border-[#f59e0b]/30 shadow-sm'
                      : 'bg-[#fafafa] text-[#64748b] border-black/[0.06]'
                  }`}
                >
                  <span>🏆 {isKnockout ? 'IPL Final / Playoff (+15%)' : 'Regular League Match'}</span>
                  <span className={`w-2 h-2 rounded-full ${isKnockout ? 'bg-[#f59e0b]' : 'bg-[#cbd5e1]'}`} />
                </button>
              </div>
            </div>

            {/* Phase Selector */}
            <div className="mb-5">
              <label className="text-xs text-[#94a3b8] font-semibold block mb-2">OVER PHASE OF INNINGS</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'powerplay', label: 'Powerplay (0-6 ov)' },
                  { id: 'middle', label: 'Middle (7-15 ov)' },
                  { id: 'death', label: 'Death Overs (16-20 ov)' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPhase(p.id as any)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      phase === p.id
                        ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                        : 'bg-[#fafafa] text-[#64748b] border-black/[0.06] hover:bg-black/[0.02]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Match Pressure */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-black/[0.05]">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#64748b]">Runs Needed:</span>
                  <span className="font-bold text-[#1a1a2e]">{runsNeeded}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={runsNeeded}
                  onChange={(e) => setRunsNeeded(Number(e.target.value))}
                  className="w-full accent-[#e63946] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#64748b]">Overs Left:</span>
                  <span className="font-bold text-[#1a1a2e]">{oversRemaining} ov</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={oversRemaining}
                  onChange={(e) => setOversRemaining(Number(e.target.value))}
                  className="w-full accent-[#e63946] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#64748b]">Wickets Left:</span>
                  <span className="font-bold text-[#1a1a2e]">{wicketsRemaining}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={wicketsRemaining}
                  onChange={(e) => setWicketsRemaining(Number(e.target.value))}
                  className="w-full accent-[#e63946] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Performance Sliders */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4 flex items-center justify-between">
              <span>2. Player In-Game Performance</span>
              <span className="text-xs font-normal text-[#94a3b8]">
                {role === 'batting' ? `SR: ${impactAnalysis.sr}` : `Eco: ${impactAnalysis.eco}`}
              </span>
            </h3>

            {role === 'batting' ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Runs Scored:</span>
                      <span className="font-bold text-[#1a1a2e]">{runs} runs</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="130"
                      value={runs}
                      onChange={(e) => setRuns(Number(e.target.value))}
                      className="w-full accent-[#e63946] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Balls Faced:</span>
                      <span className="font-bold text-[#1a1a2e]">{ballsFaced} balls</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="75"
                      value={ballsFaced}
                      onChange={(e) => setBallsFaced(Number(e.target.value))}
                      className="w-full accent-[#e63946] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-black/[0.04]">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Fours (4s):</span>
                      <span className="font-bold text-[#1a1a2e]">{fours}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={fours}
                      onChange={(e) => setFours(Number(e.target.value))}
                      className="w-full accent-[#e63946] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Sixes (6s):</span>
                      <span className="font-bold text-[#1a1a2e]">{sixes}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={sixes}
                      onChange={(e) => setSixes(Number(e.target.value))}
                      className="w-full accent-[#e63946] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Wickets Taken:</span>
                      <span className="font-bold text-[#1a1a2e]">{wickets} wkts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={wickets}
                      onChange={(e) => setWickets(Number(e.target.value))}
                      className="w-full accent-[#6366f1] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Overs Bowled:</span>
                      <span className="font-bold text-[#1a1a2e]">{oversBowled} ov</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={oversBowled}
                      onChange={(e) => setOversBowled(Number(e.target.value))}
                      className="w-full accent-[#6366f1] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-black/[0.04]">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Runs Conceded:</span>
                      <span className="font-bold text-[#1a1a2e]">{runsConceded} runs</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="65"
                      value={runsConceded}
                      onChange={(e) => setRunsConceded(Number(e.target.value))}
                      className="w-full accent-[#6366f1] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#64748b]">Dot Balls:</span>
                      <span className="font-bold text-[#1a1a2e]">{dotBalls}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={dotBalls}
                      onChange={(e) => setDotBalls(Number(e.target.value))}
                      className="w-full accent-[#6366f1] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Calculated Impact & Counterfactual Delta (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Score Card */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e63946] to-[#ff4d5a]" />

            <span className="text-xs font-semibold text-[#94a3b8] tracking-widest uppercase">
              Simulated CricketIQ Rating
            </span>

            <div className="my-3">
              <ImpactMeter score={impactAnalysis.current.normalizedImpact} size="lg" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: scoreColor + '18', color: scoreColor }}>
              {scoreLabel.toUpperCase()} IMPACT
            </div>

            {/* Win Probability Bar */}
            <div className="bg-[#fafafa] rounded-xl p-3 border border-black/[0.04] mb-4 text-left">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#64748b] font-medium">Situation Win Probability:</span>
                <span className="font-bold text-[#1a1a2e]">{winProbability}%</span>
              </div>
              <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${winProbability}%`,
                    backgroundColor: winProbability > 50 ? '#22c55e' : '#ef4444',
                  }}
                />
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                Required Run Rate: <strong className="text-[#1a1a2e]">{requiredRunRate} RPO</strong> ({runsNeeded} off {oversRemaining * 6} balls)
              </p>
            </div>

            {/* Multipliers Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/[0.05] text-center">
              <div className="p-2 rounded-lg bg-[#fafafa]">
                <p className="text-[10px] text-[#94a3b8] uppercase">Performance</p>
                <p className="text-sm font-bold text-[#1a1a2e]">{Math.round(impactAnalysis.current.performanceScore)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#fafafa]">
                <p className="text-[10px] text-[#94a3b8] uppercase">Context</p>
                <p className="text-sm font-bold text-[#e63946]">{impactAnalysis.current.contextWeight.toFixed(2)}x</p>
              </div>
              <div className="p-2 rounded-lg bg-[#fafafa]">
                <p className="text-[10px] text-[#94a3b8] uppercase">Pressure</p>
                <p className="text-sm font-bold text-[#f59e0b]">{impactAnalysis.current.pressureWeight.toFixed(2)}x</p>
              </div>
            </div>
          </div>

          {/* Counterfactual "Why Situation Matters" Card */}
          <div className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-[#e63946]/10 flex items-center justify-center text-[#e63946] text-xs font-bold">
                💡
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1a2e]">
                The CricketIQ Proof (What-If Delta)
              </h4>
            </div>

            <p className="text-xs text-[#64748b] leading-relaxed mb-3">
              If this exact same score happened in a standard low-pressure league game:
            </p>

            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/[0.05] mb-3">
              <div>
                <p className="text-xs text-[#94a3b8]">Standard Situation Rating</p>
                <p className="text-lg font-bold text-[#64748b]">{impactAnalysis.baseline.normalizedImpact.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8]">Crisis Situation Rating</p>
                <p className="text-lg font-bold text-[#e63946]">{impactAnalysis.current.normalizedImpact.toFixed(1)}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#f0fdf4] border border-[#22c55e]/20 text-[12px] text-[#166534]">
              {impactAnalysis.delta >= 0 ? (
                <span>
                  🔥 <strong>+{impactAnalysis.delta} points boosted</strong> by high RRR ({requiredRunRate}), wickets pressure, and late phase gravity!
                </span>
              ) : (
                <span>
                  📉 <strong>{impactAnalysis.delta} points adjustment</strong> due to lower pressure environment.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
