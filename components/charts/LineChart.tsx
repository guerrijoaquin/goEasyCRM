'use client';

import { useState } from 'react';

interface LineChartProps {
  values?: number[];
  days?: string[];
  color?: string;
}

export default function LineChart({
  values = [],
  days = [],
  color = '#3b82f6',
}: LineChartProps) {
  const W = 400, H = 110, PX = 14, PY = 12;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => ({
    x: PX + (i / Math.max(values.length - 1, 1)) * (W - PX * 2),
    y: PY + (1 - v / max) * (H - PY * 2),
  }));
  const linePath = pts
    .map((p, i) =>
      i === 0
        ? `M${p.x},${p.y}`
        : `C${(pts[i - 1].x + p.x) / 2},${pts[i - 1].y} ${(pts[i - 1].x + p.x) / 2},${p.y} ${p.x},${p.y}`
    )
    .join(' ');
  const areaPath =
    linePath +
    ` L${pts[pts.length - 1]?.x ?? 0},${H} L${pts[0]?.x ?? 0},${H} Z`;
  const gid = 'lg' + color.replace('#', '');
  const [hovered, setHovered] = useState<number | null>(null);

  if (values.length < 2) return null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((p, i) => (
          <line
            key={i}
            x1={PX} y1={PY + p * (H - PY * 2)}
            x2={W - PX} y2={PY + p * (H - PY * 2)}
            stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4"
          />
        ))}
        <path d={areaPath} fill={`url(#${gid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g
            key={i}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              cx={p.x} cy={p.y}
              r={hovered === i ? 6 : 3.5}
              fill={hovered === i ? '#fff' : color}
              stroke={color} strokeWidth="2"
              style={{ transition: 'r 0.15s' }}
            />
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
          </g>
        ))}
        {days.map((d, i) => pts[i] && (
          <text key={i} x={pts[i].x} y={H} textAnchor="middle" fill="#4b5563" fontSize="10">{d}</text>
        ))}
        {hovered !== null && pts[hovered] && (
          <g>
            <rect
              x={pts[hovered].x - 38} y={pts[hovered].y - 30}
              width="76" height="22" rx="6"
              fill="#1f2937" stroke={color} strokeWidth="1" strokeOpacity="0.4"
            />
            <text
              x={pts[hovered].x} y={pts[hovered].y - 14}
              textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600"
            >
              {`$${Math.round(values[hovered]).toLocaleString('es-AR')}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
