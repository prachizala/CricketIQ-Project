'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface ImpactChartProps {
  data: number[];
  title?: string;
  height?: number;
}

export default function ImpactChart({ data, title, height = 250 }: ImpactChartProps) {
  const chartData = data.map((value, index) => ({
    innings: `M${index + 1}`,
    impact: value,
  }));

  return (
    <div>
      {title && <h3 className="text-[#1a1a2e] text-sm font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="impactGradientLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e63946" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#e63946" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis dataKey="innings" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.06)' }} tickLine={false} />
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
            cursor={{ stroke: 'rgba(230,57,70,0.2)', strokeWidth: 1 }}
            formatter={(value: any) => value != null ? [Number(value).toFixed(1), 'Impact'] : ['', '']}
          />
          <ReferenceLine y={50} stroke="rgba(0,0,0,0.06)" strokeDasharray="8 4" />
          <Area
            type="monotone"
            dataKey="impact"
            stroke="#e63946"
            strokeWidth={2}
            fill="url(#impactGradientLight)"
            dot={{ fill: '#ffffff', stroke: '#e63946', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: '#e63946', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
