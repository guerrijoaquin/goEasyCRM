'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import type { AdCampaign } from '@/lib/types';
import { formatARS } from '@/lib/types';

export default function PublicidadPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'Meta Ads', budget: '', spent: '', roas: '', cpc: '', ctr: '', conversions: '0', start_date: new Date().toISOString().slice(0, 10), status: 'active' });

  const fetchCampaigns = async () => {
    const res = await fetch('/api/publicidad');
    if (res.ok) setCampaigns(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/publicidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/publicidad/${id}`, { method: 'DELETE' });
    setCampaigns(c => c.filter(x => x.id !== id));
  };

  const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent), 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const avgRoas = campaigns.filter(c => c.roas).length > 0
    ? campaigns.filter(c => c.roas).reduce((s, c) => s + Number(c.roas), 0) / campaigns.filter(c => c.roas).length
    : 0;

  const statusConfig = {
    active:  { label: 'Activa',  color: '#22c55e', bg: '#14532d' },
    paused:  { label: 'Pausada', color: '#f59e0b', bg: '#451a03' },
    ended:   { label: 'Finalizada', color: '#6b7280', bg: '#1f2937' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Campañas activas', value: campaigns.filter(c => c.status === 'active').length, color: '#22c55e' },
          { label: 'Total invertido', value: formatARS(totalSpent), color: '#ef4444' },
          { label: 'Conversiones totales', value: totalConversions, color: '#3b82f6' },
          { label: 'ROAS promedio', value: avgRoas > 0 ? `${avgRoas.toFixed(2)}x` : '—', color: '#a855f7' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Campañas publicitarias</div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {showForm ? '✕ Cancelar' : '+ Nueva campaña'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: 22 }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Ej: Black Friday 2025' },
                { label: 'Plataforma', key: 'platform', placeholder: 'Meta Ads, Google...' },
                { label: 'Presupuesto ($)', key: 'budget', placeholder: '0' },
                { label: 'Gastado ($)', key: 'spent', placeholder: '0' },
                { label: 'ROAS', key: 'roas', placeholder: 'Ej: 3.5' },
                { label: 'CPC ($)', key: 'cpc', placeholder: 'Ej: 120' },
                { label: 'CTR', key: 'ctr', placeholder: 'Ej: 2.3%' },
                { label: 'Conversiones', key: 'conversions', placeholder: '0' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input
                    type={['budget', 'spent', 'roas', 'cpc', 'conversions'].includes(f.key) ? 'number' : 'text'}
                    placeholder={f.placeholder}
                    required={f.key === 'name'}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Estado</label>
                <select value={form.status} onChange={e => setForm(x => ({ ...x, status: e.target.value }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}>
                  <option value="active">Activa</option>
                  <option value="paused">Pausada</option>
                  <option value="ended">Finalizada</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar campaña
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card" style={{ padding: 22 }}>
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>
            No hay campañas aún. ¡Agregá tu primera campaña!
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 50px', padding: '6px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              <span>Campaña</span><span>Plataforma</span><span>Invertido</span><span>ROAS</span><span>Conv.</span><span>Estado</span><span></span>
            </div>
            {campaigns.map((c, i) => {
              const st = statusConfig[c.status];
              return (
                <div key={c.id} className="row-item" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 50px', padding: '13px 16px', alignItems: 'center', borderBottom: i < campaigns.length - 1 ? '1px solid #1f2937' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{c.start_date}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{c.platform}</span>
                  <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{formatARS(Number(c.spent))}</span>
                  <span style={{ fontSize: 13, color: c.roas && Number(c.roas) >= 2 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
                    {c.roas ? `${Number(c.roas).toFixed(2)}x` : '—'}
                  </span>
                  <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>{c.conversions}</span>
                  <div className="pill" style={{ background: st.bg + '88', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</div>
                  <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}


