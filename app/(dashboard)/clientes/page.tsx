'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import type { Client } from '@/lib/types';
import { formatARS } from '@/lib/types';

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', notes: '' });

  const fetchClients = async () => {
    const res = await fetch('/api/clientes');
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', email: '', phone: '', city: '', notes: '' });
    setShowForm(false);
    fetchClients();
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = clients.reduce((s, c) => s + Number(c.total_spent), 0);
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total clientes', value: clients.length, color: '#3b82f6' },
          { label: 'Nuevos este mes', value: `+${newThisMonth}`, color: '#22c55e' },
          { label: 'Gasto total acumulado', value: formatARS(totalSpent), color: '#a855f7' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          placeholder="🔍 Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 320, background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 14px', borderRadius: 10, fontSize: 13, outline: 'none' }}
        />
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {showForm ? '✕ Cancelar' : '+ Nuevo cliente'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Nuevo cliente</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Juan García' },
                { label: 'Email', key: 'email', placeholder: 'cliente@email.com' },
                { label: 'Teléfono', key: 'phone', placeholder: '+54 9 ...' },
                { label: 'Ciudad', key: 'city', placeholder: 'Buenos Aires' },
                { label: 'Notas', key: 'notes', placeholder: 'Observaciones...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input type="text" placeholder={f.placeholder} required={f.key === 'name'} value={form[f.key as keyof typeof form]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                </div>
              ))}
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar cliente
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card" style={{ padding: 22 }}>
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>
            {search ? 'No se encontraron clientes.' : 'No hay clientes aún.'}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              <span>Cliente</span><span>Email</span><span>Ciudad</span><span>Pedidos</span><span>Gasto total</span>
            </div>
            {filtered.map((c, i) => (
              <div key={c.id} className="row-item" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '12px 12px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #1f2937' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.phone ?? ''}</div>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.email ?? '—'}</span>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>{c.city ?? '—'}</span>
                <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>{c.total_orders}</span>
                <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{formatARS(Number(c.total_spent))}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


