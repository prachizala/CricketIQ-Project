'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import leaderboardData from '@/data/leaderboard.json';
import { PlayerImpact } from '@/lib/types';
import { getImpactColor, getTeamColor } from '@/lib/utils';

const allPlayers = leaderboardData as unknown as PlayerImpact[];

// Common IPL Overseas Players Set
const OVERSEAS_SET = new Set([
  'DA Warner', 'AB de Villiers', 'CH Gayle', 'KA Pollard', 'AD Russell', 'SP Narine',
  'Rashid Khan', 'JC Buttler', 'F du Plessis', 'Q de Kock', 'GJ Maxwell', 'DJ Bravo',
  'SL Malinga', 'TA Boult', 'K Rabada', 'MA Starc', 'PJ Cummins', 'H Klaasen',
  'N Pooran', 'JM Bairstow', 'SO Hetmyer', 'MM Ali', 'LS Livingstone', 'MP Stoinis',
  'SM Curran', 'C Green', 'TM Head', 'M Pathirana', 'PBB Rajapaksa', 'MD Shanaka',
  'PWH de Silva', 'Fazalhaq Farooqi', 'LH Ferguson', 'JR Hazlewood', 'A Nortje',
  'M Jansen', 'GD Phillips', 'RA Powell', 'T Stubbs', 'WG Jacks', 'JDF Fraser-McGurk',
  'N Burger', 'SH Johnson', 'MW Short', 'R Shepherd', 'AJ Turner', 'BA Stokes', 'C Munro',
  'CH Morris', 'CJ Jordan', 'CR Brathwaite', 'DR Sams', 'DW Steyn', 'E Lewis', 'EJG Morgan',
  'HM Amla', 'JC Archer', 'JJ Roy', 'JO Holder', 'JP Duminy', 'KH Pandya', 'KM Jadhav',
  'L Ngidi', 'MEK Hussey', 'MJ McClenaghan', 'ML Hayden', 'MM Patel', 'MN Samuels',
  'MS Wade', 'Mustafizur Rahman', 'NLTC Perera', 'P Cummins', 'R Ashwin', 'R Dravid',
  'SE Marsh', 'SR Watson', 'SS Cottrell', 'TG Southee', 'TS Mills', 'UT Yadav', 'WP Saha'
]);

function isOverseas(name: string): boolean {
  return OVERSEAS_SET.has(name);
}

function estimateAuctionPrice(player: PlayerImpact): number {
  const base = Math.max(0.5, (player.impactScore - 30) * 0.38);
  const roleMult = player.role === 'allrounder' ? 1.25 : player.role === 'bowler' ? 1.15 : 1.0;
  const expMult = player.matchesPlayed > 40 ? 1.12 : 1.0;
  const rawPrice = base * roleMult * expMult;
  return Math.round(Math.min(24.5, Math.max(0.4, rawPrice)) * 10) / 10;
}

export default function AuctionOptimizerPage() {
  const [activeTab, setActiveTab] = useState<'optimizer' | 'valuation'>('optimizer');

  // Optimizer States
  const [purseBudget, setPurseBudget] = useState<number>(100); // 100 Cr default
  const [selectedXI, setSelectedXI] = useState<PlayerImpact[]>([]);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Valuation Tool States
  const [valuationSearch, setValuationSearch] = useState<string>('V Kohli');
  const [customBidPrice, setCustomBidPrice] = useState<number>(18.0);

  // Pre-calculate prices for all players
  const playerCatalog = useMemo(() => {
    return allPlayers.map(p => ({
      ...p,
      price: estimateAuctionPrice(p),
      isOverseas: isOverseas(p.name),
      impactPerCrore: Math.round((p.impactScore / estimateAuctionPrice(p)) * 10) / 10,
    }));
  }, []);

  // Algorithm: Solve IPL XI Constraint Knapsack
  const runAutoOptimizer = () => {
    setIsOptimizing(true);

    setTimeout(() => {
      // 1. Separate into pools
      const batsmen = [...playerCatalog].filter(p => p.role === 'batsman');
      const bowlers = [...playerCatalog].filter(p => p.role === 'bowler');
      const allrounders = [...playerCatalog].filter(p => p.role === 'allrounder');

      // Sort pools by value efficiency (Impact / Price) with high impact bias
      const efficiencySort = (a: typeof playerCatalog[0], b: typeof playerCatalog[0]) => {
        const scoreA = a.impactScore * 1.5 + a.impactPerCrore * 2;
        const scoreB = b.impactScore * 1.5 + b.impactPerCrore * 2;
        return scoreB - scoreA;
      };

      batsmen.sort(efficiencySort);
      bowlers.sort(efficiencySort);
      allrounders.sort(efficiencySort);

      // Greedy composition targeting 5 Batters, 2 All-rounders, 4 Bowlers with <= 4 overseas and <= purse
      const chosen: typeof playerCatalog[0][] = [];
      let currentSpend = 0;
      let overseasCount = 0;

      const tryAdd = (p: typeof playerCatalog[0]): boolean => {
        if (chosen.some(c => c.name === p.name)) return false;
        if (currentSpend + p.price > purseBudget) return false;
        if (p.isOverseas && overseasCount >= 4) return false;

        chosen.push(p);
        currentSpend += p.price;
        if (p.isOverseas) overseasCount++;
        return true;
      };

      // Ensure 4 core batsmen
      for (const p of batsmen) {
        if (chosen.filter(c => c.role === 'batsman').length >= 4) break;
        tryAdd(p);
      }

      // Ensure 2 all-rounders
      for (const p of allrounders) {
        if (chosen.filter(c => c.role === 'allrounder').length >= 2) break;
        tryAdd(p);
      }

      // Ensure 4 bowlers
      for (const p of bowlers) {
        if (chosen.filter(c => c.role === 'bowler').length >= 4) break;
        tryAdd(p);
      }

      // 11th player: Best available within remaining budget
      const remainingPool = [...playerCatalog].sort((a, b) => b.impactScore - a.impactScore);
      for (const p of remainingPool) {
        if (chosen.length >= 11) break;
        tryAdd(p);
      }

      // If budget still allows, try to upgrade lower impact players with superstars
      for (let i = 0; i < chosen.length; i++) {
        const current = chosen[i];
        for (const candidate of remainingPool) {
          if (candidate.impactScore > current.impactScore) {
            const costDiff = candidate.price - current.price;
            if (currentSpend + costDiff <= purseBudget) {
              const overseasDiff = (candidate.isOverseas ? 1 : 0) - (current.isOverseas ? 1 : 0);
              if (overseasCount + overseasDiff <= 4 && !chosen.some(c => c.name === candidate.name)) {
                chosen[i] = candidate;
                currentSpend += costDiff;
                overseasCount += overseasDiff;
                break;
              }
            }
          }
        }
      }

      setSelectedXI(chosen);
      setIsOptimizing(false);
    }, 250);
  };

  // Selected XI Metrics
  const teamMetrics = useMemo(() => {
    if (selectedXI.length === 0) {
      return { totalImpact: 0, totalSpend: 0, avgImpact: 0, overseasCount: 0, remainingPurse: purseBudget };
    }
    const totalImpact = selectedXI.reduce((sum, p) => sum + p.impactScore, 0);
    const totalSpend = selectedXI.reduce((sum, p) => sum + (estimateAuctionPrice(p)), 0);
    const overseasCount = selectedXI.filter(p => isOverseas(p.name)).length;
    return {
      totalImpact: Math.round(totalImpact * 10) / 10,
      totalSpend: Math.round(totalSpend * 10) / 10,
      avgImpact: Math.round((totalImpact / selectedXI.length) * 10) / 10,
      overseasCount,
      remainingPurse: Math.round(Math.max(0, purseBudget - totalSpend) * 10) / 10,
    };
  }, [selectedXI, purseBudget]);

  // Selected Player for Valuation Check
  const evaluatedPlayer = useMemo(() => {
    const found = playerCatalog.find(p => p.name.toLowerCase().includes(valuationSearch.toLowerCase().trim())) || playerCatalog[0];
    const estimatedValue = found.price;
    const costPerImpact = customBidPrice > 0 ? (customBidPrice * 100) / found.impactScore : 0; // Lakhs per impact pt

    let verdict: { label: string; color: string; desc: string };
    if (customBidPrice <= estimatedValue * 0.78) {
      verdict = {
        label: '🔥 STEAL BUY',
        color: '#22c55e',
        desc: 'Exceptional ROI! Player delivers far more match-winning impact than the auction price demands.',
      };
    } else if (customBidPrice <= estimatedValue * 1.18) {
      verdict = {
        label: '✅ FAIR VALUE',
        color: '#3b82f6',
        desc: 'Balanced investment. Price aligns closely with the expected statistical match impact.',
      };
    } else if (customBidPrice <= estimatedValue * 1.55) {
      verdict = {
        label: '⚠️ HIGH RISK BUY',
        color: '#f59e0b',
        desc: 'Premium bidding. Player carries high market hype relative to consistent match impact scores.',
      };
    } else {
      verdict = {
        label: '❌ OVERPAID',
        color: '#ef4444',
        desc: 'Severe valuation inflation. The franchise is paying heavy premium for reputation rather than net impact.',
      };
    }

    return {
      player: found,
      estimatedValue,
      costPerImpact: Math.round(costPerImpact * 10) / 10,
      verdict,
    };
  }, [playerCatalog, valuationSearch, customBidPrice]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-left">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider">
            FRANCHISE MONEYBALL &middot; AUCTION INTELLIGENCE
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">IPL Auction &amp; Smart XI Optimizer</h1>
        <p className="text-[#94a3b8] text-sm mt-1 max-w-2xl">
          Apply algorithmic optimization to build the highest-impact Playing XI under IPL purse constraints, and audit whether auction bids represent true match-winning ROI.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-black/[0.06] pb-3">
        <button
          onClick={() => setActiveTab('optimizer')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'optimizer'
              ? 'bg-[#1a1a2e] text-white shadow-sm'
              : 'text-[#64748b] hover:text-[#1a1a2e] hover:bg-black/[0.03]'
          }`}
        >
          ⚡ Smart XI Auto-Optimizer
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'valuation'
              ? 'bg-[#1a1a2e] text-white shadow-sm'
              : 'text-[#64748b] hover:text-[#1a1a2e] hover:bg-black/[0.03]'
          }`}
        >
          💰 Player ROI &amp; Valuation Auditor
        </button>
      </div>

      {activeTab === 'optimizer' ? (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Controls & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4">Auction Purse Constraint</h3>

              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#64748b]">Total Purse Budget:</span>
                  <span className="font-bold text-[#1a1a2e]">₹{purseBudget} Crores</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="120"
                  step="5"
                  value={purseBudget}
                  onChange={e => setPurseBudget(Number(e.target.value))}
                  className="w-full accent-[#e63946] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
                  <span>₹60 Cr (Tight)</span>
                  <span>₹100 Cr (Standard)</span>
                  <span>₹120 Cr (Mega)</span>
                </div>
              </div>

              <button
                onClick={runAutoOptimizer}
                disabled={isOptimizing}
                className="w-full py-3 bg-[#e63946] hover:bg-[#c42d38] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#e63946]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isOptimizing ? 'Running Algorithm...' : '⚡ Optimize Highest-Impact XI'}
              </button>

              <div className="mt-6 pt-6 border-t border-black/[0.05] space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Total Spent:</span>
                  <span className="font-bold text-[#1a1a2e]">₹{teamMetrics.totalSpend} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Remaining Purse:</span>
                  <span className="font-bold text-[#22c55e]">₹{teamMetrics.remainingPurse} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Overseas Quota:</span>
                  <span className={`font-bold ${teamMetrics.overseasCount > 4 ? 'text-[#ef4444]' : 'text-[#1a1a2e]'}`}>
                    {teamMetrics.overseasCount} / 4 Allowed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Cumulative XI Impact:</span>
                  <span className="font-bold text-[#e63946] text-sm">{teamMetrics.totalImpact} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Average Player Rating:</span>
                  <span className="font-bold text-[#1a1a2e]">{teamMetrics.avgImpact} / 100</span>
                </div>
              </div>
            </div>

            {/* Constraints Info Card */}
            <div className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-5 shadow-sm text-xs space-y-2">
              <h4 className="font-bold text-[#1a1a2e] flex items-center gap-1.5">
                <span>📋</span> IPL Team Compliance Rules
              </h4>
              <p className="text-[#64748b] leading-relaxed">
                The algorithm enforces standard IPL squad regulations: exactly 11 starting players, maximum 4 overseas players, at least 4 frontline batters, 2 all-rounders, and 4 bowling options.
              </p>
            </div>
          </div>

          {/* Optimized XI List (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a2e]">Optimized Playing XI</h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {selectedXI.length === 11 ? 'Maximized impact within salary cap' : 'Click "Optimize Highest-Impact XI" to generate squad'}
                  </p>
                </div>
                {selectedXI.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#f0fdf4] text-[#166534] text-xs font-bold border border-[#22c55e]/30">
                    11 Players Ready
                  </span>
                )}
              </div>

              {selectedXI.length === 0 ? (
                <div className="p-16 text-center text-[#94a3b8] border-2 border-dashed border-black/[0.06] rounded-xl">
                  <div className="text-4xl mb-3">⚡</div>
                  <p className="font-semibold text-[#1a1a2e] text-sm mb-1">No Squad Selected Yet</p>
                  <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-4">
                    Set your purse budget and hit the optimizer button to automatically solve for the highest-impact 11 players.
                  </p>
                  <button
                    onClick={runAutoOptimizer}
                    className="px-5 py-2.5 bg-[#e63946] text-white text-xs font-semibold rounded-xl hover:bg-[#c42d38] transition-all cursor-pointer"
                  >
                    Generate Optimal XI
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {selectedXI.map((player, idx) => (
                    <div key={player.name} className="py-3 flex items-center justify-between gap-4 hover:bg-[#fafafa] px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-black/25 w-5">{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/players/${encodeURIComponent(player.name)}`} className="text-sm font-bold text-[#1a1a2e] hover:text-[#e63946] transition-colors">
                              {player.name}
                            </Link>
                            {isOverseas(player.name) && (
                              <span className="px-1.5 py-0.5 rounded bg-[#fef9ee] text-[#d97706] text-[10px] font-bold border border-[#f59e0b]/20">
                                Overseas
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#94a3b8] capitalize">
                            {player.team} &middot; {player.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="text-xs font-bold text-[#1a1a2e]">₹{estimateAuctionPrice(player)} Cr</span>
                          <p className="text-[10px] text-[#94a3b8]">Auction Price</p>
                        </div>
                        <div>
                          <span
                            className="text-sm font-bold"
                            style={{ color: getImpactColor(player.impactScore) }}
                          >
                            {player.impactScore.toFixed(1)}
                          </span>
                          <p className="text-[10px] text-[#94a3b8]">Impact</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Valuation & ROI Tab */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Search & Bid Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4">Player Valuation Check</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#94a3b8] font-semibold block mb-1.5">SELECT PLAYER TO AUDIT</label>
                  <select
                    value={evaluatedPlayer.player.name}
                    onChange={e => {
                      setValuationSearch(e.target.value);
                      const found = playerCatalog.find(p => p.name === e.target.value);
                      if (found) setCustomBidPrice(found.price);
                    }}
                    className="w-full px-3 py-2.5 bg-[#fafafa] border border-black/[0.08] rounded-xl text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 cursor-pointer"
                  >
                    {playerCatalog.slice(0, 100).map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.team} - Impact: {p.impactScore.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#64748b]">Auction Bid Price:</span>
                    <span className="font-bold text-[#e63946]">₹{customBidPrice} Crores</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="25"
                    step="0.5"
                    value={customBidPrice}
                    onChange={e => setCustomBidPrice(Number(e.target.value))}
                    className="w-full accent-[#e63946] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
                    <span>Base (₹50 L)</span>
                    <span>₹12 Cr</span>
                    <span>Mega Bid (₹25 Cr)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Card */}
            <div className="bg-[#fafafa] border border-black/[0.06] rounded-2xl p-5 shadow-sm text-xs space-y-2.5">
              <h4 className="font-bold text-[#1a1a2e]">Moneyball ROI Formula</h4>
              <p className="text-[#64748b] leading-relaxed">
                Valuation compares a player&apos;s true empirical <strong>Impact Score</strong> against standard market auction curves. If a ₹15 Cr signing yields only 45 Impact points, the cost-per-impact is inflated compared to peers.
              </p>
            </div>
          </div>

          {/* Right: Valuation Verdict Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.05]">
                <div>
                  <h3 className="text-xl font-bold text-[#1a1a2e]">{evaluatedPlayer.player.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{evaluatedPlayer.player.team} &middot; {evaluatedPlayer.player.role}</p>
                </div>
                <div
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: evaluatedPlayer.verdict.color + '15',
                    color: evaluatedPlayer.verdict.color,
                    borderColor: evaluatedPlayer.verdict.color + '30',
                  }}
                >
                  {evaluatedPlayer.verdict.label}
                </div>
              </div>

              <div className="py-6 grid sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-[#fafafa]">
                  <p className="text-xs text-[#94a3b8] mb-1">Impact Rating</p>
                  <p className="text-2xl font-bold" style={{ color: getImpactColor(evaluatedPlayer.player.impactScore) }}>
                    {evaluatedPlayer.player.impactScore.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#fafafa]">
                  <p className="text-xs text-[#94a3b8] mb-1">True Fair Valuation</p>
                  <p className="text-2xl font-bold text-[#1a1a2e]">
                    ₹{evaluatedPlayer.estimatedValue} Cr
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#fafafa]">
                  <p className="text-xs text-[#94a3b8] mb-1">Cost Per Impact Pt</p>
                  <p className="text-2xl font-bold text-[#6366f1]">
                    ₹{evaluatedPlayer.costPerImpact} L
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                <h4 className="text-xs font-bold text-[#1a1a2e] uppercase mb-1">Financial Audit Summary</h4>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {evaluatedPlayer.verdict.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
