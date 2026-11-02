'use client';

import { getImpactColor, getImpactLabel } from '@/lib/utils';

interface ImpactMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ImpactMeter({ score, size = 'md', showLabel = true }: ImpactMeterProps) {
  const color = getImpactColor(score);
  const label = getImpactLabel(score);

  const dimensions = {
    sm: { width: 120, height: 75, strokeWidth: 6, fontSize: 18, labelSize: 9 },
    md: { width: 200, height: 115, strokeWidth: 8, fontSize: 30, labelSize: 11 },
    lg: { width: 280, height: 160, strokeWidth: 10, fontSize: 42, labelSize: 13 },
  };

  const d = dimensions[size];
  const cx = d.width / 2;
  const cy = d.height - 10;
  const r = cx - d.strokeWidth - 4;

  const angle = (score / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const x = cx - r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={d.width} height={d.height} viewBox={`0 0 ${d.width} ${d.height}`}>
        {/* Background arc */}
        <path
          d={`M ${d.strokeWidth + 4} ${cy} A ${r} ${r} 0 0 1 ${d.width - d.strokeWidth - 4} ${cy}`}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={d.strokeWidth}
          strokeLinecap="round"
        />

        {/* Score arc */}
        {score > 0 && (
          <path
            d={`M ${d.strokeWidth + 4} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`}
            fill="none"
            stroke={color}
            strokeWidth={d.strokeWidth}
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* Needle dot */}
        {score > 0 && (
          <circle cx={x} cy={y} r={3} fill={color} opacity={0.9} />
        )}

        {/* Score text */}
        <text
          x={cx}
          y={cy - (size === 'sm' ? 14 : size === 'md' ? 18 : 24)}
          textAnchor="middle"
          fill={color}
          fontSize={d.fontSize}
          fontWeight="700"
          fontFamily="'Outfit', sans-serif"
        >
          {score.toFixed(1)}
        </text>

        {showLabel && (
          <text
            x={cx}
            y={cy - (size === 'sm' ? 2 : 4)}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={d.labelSize}
            fontFamily="'Outfit', sans-serif"
            fontWeight="600"
            letterSpacing="0.12em"
          >
            {label.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}
