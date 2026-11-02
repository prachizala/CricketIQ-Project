'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getImpactColor } from '@/lib/utils';

interface PressureTimelineProps {
  players: { name: string; team: string; impact: number }[];
  title?: string;
  subtitle?: string;
}

export default function PressureTimeline({ players, title, subtitle }: PressureTimelineProps) {
  const data = players.slice(0, 12).map(p => ({
    name: p.name.split(' ').pop(),
    fullName: p.name,
    impact: p.impact,
    team: p.team,
  }));

  return (
    <div>
      {title && <h3 className="text-[#1a1a2e] text-sm font-semibold mb-1">{title}</h3>}
      {subtitle && <p className="text-xs text-[#94a3b8] mb-4">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={300}>
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
            labelStyle={{ color: '#64748b' }}
            cursor={{ fill: 'rgba(230,57,70,0.04)' }}
            formatter={(value: any) => value != null ? [Number(value).toFixed(1), 'Impact'] : ['', '']}
            labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName || ''}
          />
          <Bar dataKey="impact" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getImpactColor(entry.impact)} fillOpacity={0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
