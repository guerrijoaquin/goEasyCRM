'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { formatARS } from '@/lib/types';

export default function RentabilidadPage() {
  const [loading, setLoading] = useState(true);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [costPct, setCostPct] = useState(40);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/rentabilidad');
      if (res.ok) {
        const data = await res.json();
        setTotalIngresos(data.ingresos);
        setTotalGastos(data.gastos);
      }
      setLoading(false);
    };
    load();
  }, []);

  const costoMerch = totalIngresos * (costPct / 100);
  const utilBruta = totalIngresos - costoMerch;
  const utilNeta = utilBruta - totalGastos;
  const margenBruto = totalIngresos > 0 ? (utilBruta / totalIngresos * 100).toFixed(1) : '0';
  const margenNeto = totalIngresos > 0 ? (utilNeta / totalIngresos * 100).toFixed(1) : '0';

  const funnelItems = [
    { label: 'Ingresos brutos', value: totalIngresos, color: '#3b82f6' },
    { label: 'Costo de mercadería', value: costoMerch, color: '#f59e0b' },
    { label: 'Utilidad bruta', value: utilBruta, color: '#8b5cf6' },
    { label: 'Gastos estructura', value: totalGastos, color: '#ef4444' },
    { label: 'Utilidad neta', value: utilNeta, color: utilNeta >= 0 ? '#22c55e' : '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Ingresos del mes', value: formatARS(totalIngresos), color: '#3b82f6' },
          { label: 'Utilidad bruta', value: formatARS(utilBruta), color: '#8b5cf6' },
          { label: 'Margen bruto', value: `${margenBruto}%`, color: '#a855f7' },
          { label: 'Utilidad neta', value: formatARS(utilNeta), color: utilNeta >= 0 ? '#22c55e' : '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Config */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>⚙️ Configuración</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
              % Costo de mercadería sobre ventas: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{costPct}%</span>
            </label>
            <input
              type="range" min="0" max="100" value={costPct}
              onChange={e => setCostPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              <span>0%</span><span>100%</span>
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funnelItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < funnelItems.length - 1 ? '1px solid #1f2937' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: 'DM Mono, monospace' }}>
                    {item.value < 0 ? '-' : ''}{formatARS(Math.abs(item.value))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Breakdown visual */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Distribución de ingresos</div>
          {loading ? (
            <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Costo de mercadería', value: costoMerch, color: '#f59e0b', pct: costPct },
                { label: 'Gastos estructura', value: totalGastos, color: '#ef4444', pct: totalIngresos > 0 ? Math.round((totalGastos / totalIngresos) * 100) : 0 },
                { label: 'Utilidad neta', value: Math.max(utilNeta, 0), color: '#22c55e', pct: totalIngresos > 0 ? Math.max(Math.round((utilNeta / totalIngresos) * 100), 0) : 0 },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>{item.label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{formatARS(item.value)}</span>
                      <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>{item.pct}%</span>
                    </div>
                  </div>
                  <div style={{ background: '#1f2937', borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${Math.min(item.pct, 100)}%`, height: '100%', background: item.color, borderRadius: 4, opacity: 0.8, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: utilNeta >= 0 ? '#14532d55' : '#450a0a55', border: `1px solid ${utilNeta >= 0 ? '#22c55e33' : '#ef444433'}` }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Margen neto</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: utilNeta >= 0 ? '#22c55e' : '#ef4444' }}>
                  {margenNeto}%
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {utilNeta >= 0 ? '✓ Negocio rentable este mes' : '⚠ Gastos superan los ingresos'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


