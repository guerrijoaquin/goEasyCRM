'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import type { Expense } from '@/lib/types';
import { formatARS, EXPENSE_CATEGORIES } from '@/lib/types';

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchExpenses = async () => {
    const res = await fetch('/api/gastos');
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(f => ({ ...f, amount: '', description: '' }));
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
    setExpenses(e => e.filter(x => x.id !== id));
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total gastos del mes', value: formatARS(totalExpenses), color: '#ef4444' },
          { label: 'Rubros activos', value: byCategory.length, color: '#f59e0b' },
          { label: 'Promedio por gasto', value: expenses.length > 0 ? formatARS(totalExpenses / expenses.length) : '$0', color: '#9ca3af' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* Formulario */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>➕ Cargar gasto</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Rubro</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Expense['category'] }))}
                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Monto ($) *</label>
              <input
                type="number"
                placeholder="0"
                required
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Descripción</label>
              <input
                type="text"
                placeholder="Ej: OCA noviembre"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}
              />
            </div>
            <button type="submit" style={{ marginTop: 4, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Agregar gasto
            </button>
          </form>
        </div>

        {/* Breakdown por rubro */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Gastos por rubro</div>
          {byCategory.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>No hay gastos este mes.</div>
          ) : (
            byCategory.map((r, i) => {
              const pct = Math.round((r.total / totalExpenses) * 100);
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{r.category}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatARS(r.total)}</span>
                  </div>
                  <div style={{ background: '#1f2937', borderRadius: 4, height: 5 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#ef4444,#f59e0b)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Listado */}
      {expenses.length > 0 && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: '#f1f5f9' }}>Gastos del mes</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
            <span>Rubro</span><span>Descripción</span><span>Fecha</span><span style={{ textAlign: 'right' }}>Monto</span>
          </div>
          {expenses.slice(0, 20).map((g, i) => (
            <div key={g.id} className="row-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '10px 12px', alignItems: 'center', borderBottom: i < Math.min(expenses.length, 20) - 1 ? '1px solid #1f2937' : 'none' }}>
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>{g.category}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{g.description ?? '—'}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{g.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatARS(Number(g.amount))}</span>
                <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


