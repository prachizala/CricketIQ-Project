'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

interface VenueProfile {
  id: string;
  name: string;
  city: string;
  matchesHosted: number;
  avgFirstInnings: number;
  highestTotal: string;
  lowestDefended: string;
  chaseWinPct: number;
  defendWinPct: number;
  paceWicketsPct: number;
  spinWicketsPct: number;
  sixesPerMatch: number;
  dewImpact: 'Low' | 'Medium' | 'High';
  soilType: 'Red Soil (Bouncy)' | 'Black Soil (Gripping)' | 'Mixed Soil';
  boundarySize: 'Short (<65m)' | 'Medium (65-72m)' | 'Large (>75m)';
  tacticalVerdict: string;
}

const VENUES_DATABASE: VenueProfile[] = [
  {
    id: 'wankhede',
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    matchesHosted: 116,
    avgFirstInnings: 172,
    highestTotal: '235/1 (RCB vs MI)',
    lowestDefended: '118 (SRH vs MI)',
    chaseWinPct: 56,
    defendWinPct: 44,
    paceWicketsPct: 71,
    spinWicketsPct: 29,
    sixesPerMatch: 14.8,
    dewImpact: 'High',
    soilType: 'Red Soil (Bouncy)',
    boundarySize: 'Short (<65m)',
    tacticalVerdict: 'Red soil grants true bounce and seam movement early, while heavy evening coastal dew severely disadvantages bowlers in the second innings. Toss winner almost invariably bowls first.',
  },
  {
    id: 'chepauk',
    name: 'M. A. Chidambaram Stadium (Chepauk)',
    city: 'Chennai',
    matchesHosted: 85,
    avgFirstInnings: 161,
    highestTotal: '246/5 (CSK vs RR)',
    lowestDefended: '126 (RCB vs CSK)',
    chaseWinPct: 43,
    defendWinPct: 57,
    paceWicketsPct: 48,
    spinWicketsPct: 52,
    sixesPerMatch: 9.4,
    dewImpact: 'Low',
    soilType: 'Black Soil (Gripping)',
    boundarySize: 'Medium (65-72m)',
    tacticalVerdict: 'Dry, abrasive clay surface grips heavily for spinners and finger cutters. Chasing in 2nd innings is notoriously difficult as the pitch slows down and deteriorates. Batting first is a decisive edge.',
  },
  {
    id: 'chinnaswamy',
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    matchesHosted: 94,
    avgFirstInnings: 184,
    highestTotal: '287/3 (SRH vs RCB)',
    lowestDefended: '138 (PBKS vs RCB)',
    chaseWinPct: 58,
    defendWinPct: 42,
    paceWicketsPct: 66,
    spinWicketsPct: 34,
    sixesPerMatch: 18.2,
    dewImpact: 'High',
    soilType: 'Mixed Soil',
    boundarySize: 'Short (<65m)',
    tacticalVerdict: 'High altitude (920m) and sub-60m square boundaries make this the most extreme batting paradise in world cricket. 200 is par; death bowlers require defensive yorkers outside off stump.',
  },
  {
    id: 'eden_gardens',
    name: 'Eden Gardens',
    city: 'Kolkata',
    matchesHosted: 93,
    avgFirstInnings: 174,
    highestTotal: '262/2 (PBKS vs KKR)',
    lowestDefended: '131 (KKR vs RCB)',
    chaseWinPct: 53,
    defendWinPct: 47,
    paceWicketsPct: 62,
    spinWicketsPct: 38,
    sixesPerMatch: 15.6,
    dewImpact: 'Medium',
    soilType: 'Mixed Soil',
    boundarySize: 'Medium (65-72m)',
    tacticalVerdict: 'Lush outfield and true bounce allow batters to hit through the line. Spinners find grip through the middle overs, but pace variations are crucial in the closing overs.',
  },
  {
    id: 'narendra_modi',
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    matchesHosted: 42,
    avgFirstInnings: 171,
    highestTotal: '233/3 (GT vs MI)',
    lowestDefended: '130 (DC vs GT)',
    chaseWinPct: 52,
    defendWinPct: 48,
    paceWicketsPct: 68,
    spinWicketsPct: 32,
    sixesPerMatch: 12.8,
    dewImpact: 'Medium',
    soilType: 'Red Soil (Bouncy)',
    boundarySize: 'Large (>75m)',
    tacticalVerdict: 'Colossal 75m+ square boundaries test running between the wickets. Dual pitch configuration (black vs red soil) dramatically changes dynamics; red pitches favor high pace, black pitches slow cutters.',
  },
  {
    id: 'arun_jaitley',
    name: 'Arun Jaitley Stadium',
    city: 'Delhi',
    matchesHosted: 87,
    avgFirstInnings: 168,
    highestTotal: '266/7 (SRH vs DC)',
    lowestDefended: '143 (CSK vs DC)',
    chaseWinPct: 54,
    defendWinPct: 46,
    paceWicketsPct: 58,
    spinWicketsPct: 42,
    sixesPerMatch: 13.5,
    dewImpact: 'Low',
    soilType: 'Mixed Soil',
    boundarySize: 'Short (<65m)',
    tacticalVerdict: 'Compact dimensions favor straight boundary hitters. Spinners who bowl flatter trajectories restrict scoring through the middle overs.',
  },
];

export default function VenuesPage() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>('wankhede');

  // Venue Normalizer Calculator state
  const [inputScore, setInputScore] = useState<number>(165);
  const [inputRole, setInputRole] = useState<'team' | 'player'>('team');

  const selectedVenue = useMemo(() => {
    return VENUES_DATABASE.find(v => v.id === selectedVenueId) || VENUES_DATABASE[0];
  }, [selectedVenueId]);

  // Normalization logic: Evaluates score against ground difficulty
  const normalizedVerdict = useMemo(() => {
    const par = selectedVenue.avgFirstInnings;
    if (inputRole === 'team') {
      const diff = inputScore - par;
      const pct = Math.round((diff / par) * 100);
      let evaluation = '';
      let color = '';

      if (diff >= 20) {
        evaluation = `Elite Match-Winning Total (${pct > 0 ? '+' : ''}${pct}% above ground par)`;
        color = '#22c55e';
      } else if (diff >= 5) {
        evaluation = `Above Par Total (${pct > 0 ? '+' : ''}${pct}% above ground par)`;
        color = '#3b82f6';
      } else if (diff >= -10) {
        evaluation = `Competitive Par Total (${pct > 0 ? '+' : ''}${pct}% of ground par)`;
        color = '#f59e0b';
      } else {
        evaluation = `Sub-Par Total (${pct}% below ground par — severe defense pressure on bowlers)`;
        color = '#ef4444';
      }

      // Equivalent score on Chinnaswamy (highest scoring) vs Chepauk (lowest scoring)
      const chinnaswamyEquivalent = Math.round(inputScore * (184 / par));
      const chepaukEquivalent = Math.round(inputScore * (161 / par));

      return { diff, pct, evaluation, color, chinnaswamyEquivalent, chepaukEquivalent };
    } else {
      // Individual Batter innings (e.g. 50 runs)
      const diff = inputScore - 40; // baseline 40
      const venueAdjustedRuns = Math.round(inputScore * (170 / par));
      return {
        diff,
        pct: Math.round(((venueAdjustedRuns - inputScore) / inputScore) * 100),
        evaluation: `Equivalent to ${venueAdjustedRuns} runs on a standard neutral IPL wicket`,
        color: inputScore >= 50 ? '#22c55e' : '#f59e0b',
        chinnaswamyEquivalent: Math.round(inputScore * (184 / par)),
        chepaukEquivalent: Math.round(inputScore * (161 / par)),
      };
    }
  }, [selectedVenue, inputScore, inputRole]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-left">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            STADIUM INTELLIGENCE &middot; PITCH NORMALIZER
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Venue Par Intelligence &amp; Pitch Normalizer</h1>
        <p className="text-[#94a3b8] text-sm mt-1 max-w-2xl">
          Cricket performance cannot be judged in a vacuum. A 155 at Chepauk is often more match-winning than 195 at Chinnaswamy. Analyze stadium par metrics and normalize scores across venues.
        </p>
      </div>

      {/* Venue Select Pills */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center gap-2.5 min-w-max">
          {VENUES_DATABASE.map(venue => (
            <button
              key={venue.id}
              onClick={() => setSelectedVenueId(venue.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedVenueId === venue.id
                  ? 'bg-[#1a1a2e] text-white shadow-md'
                  : 'bg-white border border-black/[0.06] text-[#475569] hover:text-[#1a1a2e] hover:border-[#e63946]/40'
              }`}
            >
              🏟️ {venue.name.split(' (')[0]} ({venue.city})
            </button>
          ))}
        </div>
      </div>

      {/* Main Stadium Profile Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start mb-8">
        {/* Left: Stadium Deep Dive Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e63946] to-[#6366f1]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/[0.05]">
              <div>
                <h3 className="text-xl font-bold text-[#1a1a2e]">{selectedVenue.name}</h3>
                <p className="text-xs text-[#94a3b8]">{selectedVenue.city} &middot; {selectedVenue.matchesHosted} IPL Matches Analyzed</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#fafafa] border border-black/[0.06] text-[11px] font-bold text-[#1a1a2e]">
                  {selectedVenue.boundarySize}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#fef9ee] text-[#d97706] text-[11px] font-bold border border-[#f59e0b]/20">
                  Dew: {selectedVenue.dewImpact}
                </span>
              </div>
            </div>

            {/* Macro Stats */}
            <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">1st Innings Par</p>
                <p className="text-2xl font-bold text-[#e63946]">{selectedVenue.avgFirstInnings}</p>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">Chasing Win Rate</p>
                <p className="text-2xl font-bold text-[#3b82f6]">{selectedVenue.chaseWinPct}%</p>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">Pace / Spin Wkts</p>
                <p className="text-lg font-bold text-[#1a1a2e]">{selectedVenue.paceWicketsPct}% / {selectedVenue.spinWicketsPct}%</p>
              </div>
              <div className="p-3 bg-[#fafafa] rounded-xl">
                <p className="text-[11px] text-[#94a3b8] mb-0.5">Avg 6s / Match</p>
                <p className="text-2xl font-bold text-[#1a1a2e]">{selectedVenue.sixesPerMatch}</p>
              </div>
            </div>

            {/* Pace vs Spin Bar Chart */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[#e63946]">Pace Wickets: {selectedVenue.paceWicketsPct}%</span>
                <span className="text-[#6366f1]">Spin Wickets: {selectedVenue.spinWicketsPct}%</span>
              </div>
              <div className="w-full h-3 bg-black/[0.06] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#e63946] transition-all duration-300"
                  style={{ width: `${selectedVenue.paceWicketsPct}%` }}
                />
                <div
                  className="h-full bg-[#6366f1] transition-all duration-300"
                  style={{ width: `${selectedVenue.spinWicketsPct}%` }}
                />
              </div>
            </div>

            {/* Tactical Curator Note */}
            <div className="p-4 rounded-xl bg-[#fafafa] border border-black/[0.05]">
              <h4 className="text-xs font-bold text-[#1a1a2e] uppercase mb-1 flex items-center gap-1.5">
                <span>📋</span> Tactical Pitch Assessment
              </h4>
              <p className="text-xs text-[#64748b] leading-relaxed">
                {selectedVenue.tacticalVerdict}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Venue Par Normalizer Calculator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">⚖️</span>
              <h3 className="text-sm font-bold text-[#1a1a2e]">Interactive Score Normalizer</h3>
            </div>
            <p className="text-xs text-[#94a3b8] mb-4">
              Enter any match score at {selectedVenue.name.split(' (')[0]} to calculate venue-adjusted true value.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-[#94a3b8] font-bold block mb-1.5">EVALUATION TARGET</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setInputRole('team'); setInputScore(165); }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      inputRole === 'team'
                        ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                        : 'bg-[#fafafa] text-[#64748b] border-black/[0.06]'
                    }`}
                  >
                    Team Total Runs
                  </button>
                  <button
                    onClick={() => { setInputRole('player'); setInputScore(55); }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      inputRole === 'player'
                        ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                        : 'bg-[#fafafa] text-[#64748b] border-black/[0.06]'
                    }`}
                  >
                    Batter Innings Score
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#64748b]">{inputRole === 'team' ? 'Team Innings Total:' : 'Batter Score:'}</span>
                  <span className="font-bold text-[#e63946] text-base">{inputScore} runs</span>
                </div>
                <input
                  type="range"
                  min={inputRole === 'team' ? 100 : 15}
                  max={inputRole === 'team' ? 250 : 130}
                  value={inputScore}
                  onChange={e => setInputScore(Number(e.target.value))}
                  className="w-full accent-[#e63946] cursor-pointer"
                />
              </div>
            </div>

            {/* Normalization Result Display */}
            <div className="p-4 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-3">
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-wider">Venue Normalized Verdict</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: normalizedVerdict.color }}>
                  {normalizedVerdict.evaluation}
                </p>
              </div>

              <div className="pt-3 border-t border-black/[0.05] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Equivalent on Chinnaswamy (Flat Track):</span>
                  <strong className="text-[#1a1a2e]">{normalizedVerdict.chinnaswamyEquivalent} runs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Equivalent on Chepauk (Spin Trap):</span>
                  <strong className="text-[#1a1a2e]">{normalizedVerdict.chepaukEquivalent} runs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
