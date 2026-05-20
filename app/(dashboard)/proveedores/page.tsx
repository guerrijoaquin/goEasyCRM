'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import type { Supplier, SupplierNote } from '@/lib/types';
import { formatARS } from '@/lib/types';

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', category: '', balance: '' });
  const [noteForm, setNoteForm] = useState({ text: '', type: 'info' as SupplierNote['type'] });

  const fetchSuppliers = async () => {
    const res = await fetch('/api/proveedores');
    if (res.ok) setSuppliers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', contact: '', email: '', phone: '', category: '', balance: '' });
    setShowForm(false);
    fetchSuppliers();
  };

  const handleAddNote = async (supplierId: string) => {
    if (!noteForm.text.trim()) return;
    await fetch(`/api/proveedores/${supplierId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteForm),
    });
    setNoteForm({ text: '', type: 'info' });
    fetchSuppliers();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/proveedores/${id}`, { method: 'DELETE' });
    setSuppliers(s => s.filter(x => x.id !== id));
  };

  const totalDeuda = suppliers.reduce((s, p) => s + Number(p.balance), 0);
  const noteColors = { info: '#3b82f6', warning: '#f59e0b', success: '#22c55e' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total proveedores', value: suppliers.length, color: '#3b82f6' },
          { label: 'Deuda total', value: formatARS(totalDeuda), color: '#ef4444' },
          { label: 'Con saldo pendiente', value: suppliers.filter(s => Number(s.balance) > 0).length, color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Mis proveedores</div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {showForm ? '✕ Cancelar' : '+ Nuevo proveedor'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: 22 }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Proveedor XYZ' },
                { label: 'Contacto', key: 'contact', placeholder: 'Nombre de contacto' },
                { label: 'Email', key: 'email', placeholder: 'proveedor@email.com' },
                { label: 'Teléfono', key: 'phone', placeholder: '+54 ...' },
                { label: 'Rubro', key: 'category', placeholder: 'Textil, Tecnología...' },
                { label: 'Saldo deudor ($)', key: 'balance', placeholder: '0' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input
                    type={f.key === 'balance' ? 'number' : 'text'}
                    placeholder={f.placeholder}
                    required={f.key === 'name'}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar proveedor
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
        ) : suppliers.length === 0 ? (
          <div className="card" style={{ padding: 22, color: '#4b5563', fontSize: 13 }}>No hay proveedores aún.</div>
        ) : (
          suppliers.map(sup => {
            const notes = (sup.supplier_notes ?? []).sort((a: SupplierNote, b: SupplierNote) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const isOpen = expanded === sup.id;
            return (
              <div key={sup.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : sup.id)}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1f2937,#374151)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤝</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{sup.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{sup.category ?? '—'} · {sup.contact ?? '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: Number(sup.balance) > 0 ? '#ef4444' : '#22c55e' }}>
                      {Number(sup.balance) > 0 ? `Debe ${formatARS(Number(sup.balance))}` : 'Sin deuda'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{notes.length} novedades</div>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: 16, marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1f2937' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                      {/* Info */}
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contacto</div>
                        <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 4 }}>{sup.email ?? 'Sin email'}</div>
                        <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 12 }}>{sup.phone ?? 'Sin teléfono'}</div>
                        <button onClick={() => handleDelete(sup.id)} style={{ background: '#450a0a55', border: '1px solid #ef444433', color: '#ef4444', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                          Eliminar proveedor
                        </button>
                      </div>

                      {/* Novedades */}
                      <div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Novedades</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          <input
                            type="text"
                            placeholder="Agregar novedad..."
                            value={noteForm.text}
                            onChange={e => setNoteForm(n => ({ ...n, text: e.target.value }))}
                            style={{ flex: 1, background: '#0d1117', border: '1px solid #374151', color: '#e2e8f0', padding: '6px 10px', borderRadius: 8, fontSize: 12, outline: 'none' }}
                          />
                          <select value={noteForm.type} onChange={e => setNoteForm(n => ({ ...n, type: e.target.value as SupplierNote['type'] }))} style={{ background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '6px', borderRadius: 8, fontSize: 12 }}>
                            <option value="info">Info</option>
                            <option value="warning">Alerta</option>
                            <option value="success">OK</option>
                          </select>
                          <button onClick={() => handleAddNote(sup.id)} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>+</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                          {notes.map((n: SupplierNote) => (
                            <div key={n.id} style={{ padding: '8px 10px', borderRadius: 8, background: '#0d1117', border: `1px solid ${noteColors[n.type]}33`, fontSize: 12, color: noteColors[n.type] }}>
                              {n.text}
                              <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 8 }}>{new Date(n.created_at).toLocaleDateString('es-AR')}</span>
                            </div>
                          ))}
                          {notes.length === 0 && <div style={{ fontSize: 12, color: '#4b5563' }}>Sin novedades.</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


