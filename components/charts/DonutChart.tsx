interface Segment {
  value: number;
  color: string;
  label?: string;
}

interface DonutChartProps {
  segments: Segment[];
  centerLabel?: string;
  centerSub?: string;
}

export default function DonutChart({
  segments,
  centerLabel,
  centerSub = 'canales',
}: DonutChartProps) {
  const R = 52, CX = 64, CY = 64, SW = 15;
  const C = 2 * Math.PI * R;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let used = 0;

  return (
    <svg viewBox="0 0 128 128" style={{ width: 120, height: 120, flexShrink: 0 }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1f2937" strokeWidth={SW} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = Math.max(pct * C - 3, 0);
        const offset = C / 4 - used * C;
        used += pct;
        return (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={SW}
            strokeDasharray={`${dash} ${C}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">
        {centerLabel ?? segments.length}
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="#6b7280" fontSize="9">
        {centerSub}
      </text>
    </svg>
  );
}
