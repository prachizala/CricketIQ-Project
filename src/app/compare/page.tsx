'use client';

import { useMemo, useState } from 'react';
import { getAllPlayerImpacts } from '@/lib/dataLoader';
import PlayerComparison from '@/components/PlayerComparison';

export default function ComparePage() {
  const allPlayers = useMemo(() => getAllPlayerImpacts(), []);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const player1 = allPlayers.find(p => p.name === player1Name);
  const player2 = allPlayers.find(p => p.name === player2Name);

  const filtered1 = search1
    ? allPlayers.filter(p => p.name.toLowerCase().includes(search1.toLowerCase())).slice(0, 8)
    : [];
  const filtered2 = search2
    ? allPlayers.filter(p => p.name.toLowerCase().includes(search2.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8 slide-in-left" style={{ animationDelay: '0.05s' }}>
        <span className="inline-block px-3 py-1 rounded-full bg-[#fef0f1] text-[#e63946] text-xs font-semibold tracking-wider mb-3">
          HEAD TO HEAD
        </span>
        <h1 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Compare Players</h1>
      </div>

      <div className="fade-in fade-in-1 grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <label className="text-xs text-[#94a3b8] font-semibold mb-2.5 block tracking-wider">PLAYER 1</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search player name..."
              value={player1Name || search1}
              onChange={e => { setSearch1(e.target.value); setPlayer1Name(''); }}
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.06] rounded-xl text-[#1a1a2e] placeholder-[#b0b8c4] text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 transition-all"
            />
            {filtered1.length > 0 && !player1Name && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.08] rounded-xl overflow-hidden z-10 max-h-64 overflow-y-auto shadow-lg">
                {filtered1.map(p => (
                  <button
                    key={p.name}
                    onClick={() => { setPlayer1Name(p.name); setSearch1(''); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#475569] hover:bg-[#fff5f5] transition-colors flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[#94a3b8] font-semibold">{p.impactScore.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {player1 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#e63946]" />
              <span className="text-[#e63946] text-xs font-semibold">{player1.team} &middot; Rating {player1.impactScore.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
          <label className="text-xs text-[#94a3b8] font-semibold mb-2.5 block tracking-wider">PLAYER 2</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search player name..."
              value={player2Name || search2}
              onChange={e => { setSearch2(e.target.value); setPlayer2Name(''); }}
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.06] rounded-xl text-[#1a1a2e] placeholder-[#b0b8c4] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
            />
            {filtered2.length > 0 && !player2Name && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.08] rounded-xl overflow-hidden z-10 max-h-64 overflow-y-auto shadow-lg">
                {filtered2.map(p => (
                  <button
                    key={p.name}
                    onClick={() => { setPlayer2Name(p.name); setSearch2(''); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#475569] hover:bg-[#eef2ff] transition-colors flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[#94a3b8] font-semibold">{p.impactScore.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {player2 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
              <span className="text-[#6366f1] text-xs font-semibold">{player2.team} &middot; Rating {player2.impactScore.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {(!player1 || !player2) && (
        <div className="fade-in fade-in-2 bg-white border border-black/[0.06] rounded-2xl p-5 mb-8 shadow-sm">
          <h3 className="text-[#475569] text-sm font-semibold mb-3">Popular Comparisons</h3>
          <div className="flex flex-wrap gap-2">
            {[
              ['V Kohli', 'RG Sharma'],
              ['AB de Villiers', 'DA Warner'],
              ['MS Dhoni', 'KL Rahul'],
              ['JJ Bumrah', 'Rashid Khan'],
              ['SA Yadav', 'HH Pandya'],
            ].map(([p1, p2]) => (
              <button
                key={`${p1}-${p2}`}
                onClick={() => { setPlayer1Name(p1); setPlayer2Name(p2); setSearch1(''); setSearch2(''); }}
                className="px-4 py-2 bg-[#fafafa] border border-black/[0.06] hover:border-[#e63946]/20 hover:bg-[#fff5f5] rounded-xl text-[13px] text-[#475569] hover:text-[#e63946] transition-all font-medium"
              >
                {p1} vs {p2}
              </button>
            ))}
          </div>
        </div>
      )}

      {player1 && player2 && (
        <div className="fade-in fade-in-2 bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
          <PlayerComparison player1={player1} player2={player2} />
        </div>
      )}

      {(!player1 || !player2) && (
        <div className="text-center py-16">
          <p className="text-[#64748b] text-sm mb-1">Select two players to compare</p>
          <p className="text-[#b0b8c4] text-xs">Search above or pick one of the popular matchups</p>
        </div>
      )}
    </div>
  );
}
