'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getImpactColor } from '@/lib/utils';
import { ImpactBreakdown } from '@/lib/types';

interface PressureTimelineProps {
  players: { name: string; team: string; impact: number; breakdown?: ImpactBreakdown }[];
  title?: string;
  subtitle?: string;
}

export default function PressureTimeline({ players, title, subtitle }: PressureTimelineProps) {
  const data = players.slice(0, 12).map(p => ({
    name: p.name.split(' ').pop(),
    fullName: p.name,
    impact: p.impact,
    team: p.team,
    perf: p.breakdown?.performanceScore ? Math.round(p.breakdown.performanceScore) : undefined,
    context: p.breakdown?.contextWeight ? p.breakdown.contextWeight.toFixed(2) : undefined,
    pressure: p.breakdown?.pressureWeight ? p.breakdown.pressureWeight.toFixed(2) : undefined,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          {title && <h3 className="text-[#1a1a2e] text-sm font-semibold mb-0.5">{title}</h3>}
          {subtitle && <p className="text-xs text-[#94a3b8]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]" /> Elite (75+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#84cc16]" /> High (60+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#eab308]" /> Good (50+)
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(0,0,0,0.06)' }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '10px',
              color: '#1a1a2e',
              fontSize: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
            itemStyle={{ color: '#1a1a2e' }}
            labelStyle={{ color: '#64748b', fontWeight: 600 }}
            cursor={{ fill: 'rgba(230,57,70,0.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const p = payload[0].payload;
              return (
                <div className="bg-white border border-black/[0.08] rounded-xl p-3 shadow-lg text-xs min-w-[180px]">
                  <p className="font-bold text-[#1a1a2e] mb-1">{p.fullName}</p>
                  <p className="text-[#94a3b8] mb-2">{p.team}</p>
                  <div className="space-y-1 border-t border-black/[0.05] pt-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Impact Score:</span>
                      <span className="font-bold text-[#e63946]">{Number(p.impact).toFixed(1)}</span>
                    </div>
                    {p.perf !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Base Performance:</span>
                        <span className="font-medium text-[#1a1a2e]">{p.perf} pts</span>
                      </div>
                    )}
                    {p.context !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Context Multiplier:</span>
                        <span className="font-medium text-[#1a1a2e]">{p.context}x</span>
                      </div>
                    )}
                    {p.pressure !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Pressure Multiplier:</span>
                        <span className="font-medium text-[#1a1a2e]">{p.pressure}x</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="impact" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getImpactColor(entry.impact)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
