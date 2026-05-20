'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import type { Order } from '@/lib/types';
import { ORDER_STATUS_CONFIG } from '@/lib/types';

export default function EnviosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    order_number: '', client_name: '', courier: '', city: '', channel: 'tiendanube', total: '', status: 'pending' as Order['status'], eta: '', notes: '',
  });

  const fetchOrders = async () => {
    const res = await fetch('/api/envios');
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        order_number: form.order_number || `#${Date.now().toString().slice(-6)}`,
      }),
    });
    setShowForm(false);
    setForm({ order_number: '', client_name: '', courier: '', city: '', channel: 'tiendanube', total: '', status: 'pending', eta: '', notes: '' });
    fetchOrders();
  };

  const handleStatusChange = async (id: string, status: Order['status']) => {
    await fetch(`/api/envios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
  };

  const countByStatus = (s: Order['status']) => orders.filter(o => o.status === s).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {([
          { label: 'Pendientes', status: 'pending' as const, color: '#f59e0b' },
          { label: 'En camino', status: 'shipped' as const, color: '#3b82f6' },
          { label: 'Entregados', status: 'delivered' as const, color: '#22c55e' },
          { label: 'Cancelados', status: 'cancelled' as const, color: '#ef4444' },
        ] as const).map((k, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: k.color }}>{countByStatus(k.status)}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Todos los pedidos</div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {showForm ? '✕ Cancelar' : '+ Nuevo pedido'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Nuevo pedido</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'N° de pedido', key: 'order_number', placeholder: '#0001' },
                { label: 'Cliente', key: 'client_name', placeholder: 'Nombre del cliente' },
                { label: 'Courier', key: 'courier', placeholder: 'Ej: OCA, Andreani...' },
                { label: 'Ciudad destino', key: 'city', placeholder: 'Ej: CABA' },
                { label: 'Canal', key: 'channel', placeholder: 'tiendanube' },
                { label: 'Total ($)', key: 'total', placeholder: '0' },
                { label: 'ETA', key: 'eta', placeholder: 'Ej: Mañana, 2-3 días' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input type={f.key === 'total' ? 'number' : 'text'} placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Estado</label>
                <select value={form.status} onChange={e => setForm(x => ({ ...x, status: e.target.value as Order['status'] }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13 }}>
                  <option value="pending">Pendiente</option>
                  <option value="shipped">En camino</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar pedido
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card" style={{ padding: 22 }}>
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
        ) : orders.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>No hay pedidos aún.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.2fr', padding: '6px 16px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              <span>ID</span><span>Cliente</span><span>Courier</span><span>Destino</span><span>Estado</span>
            </div>
            {orders.map((o, i) => {
              const st = ORDER_STATUS_CONFIG[o.status];
              const client = o.clients as { name: string } | null;
              return (
                <div key={o.id} className="row-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.2fr', padding: '13px 16px', alignItems: 'center', borderBottom: i < orders.length - 1 ? '1px solid #1f2937' : 'none' }}>
                  <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#6b7280' }}>{o.order_number}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{client?.name ?? '—'}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>${Number(o.total).toLocaleString('es-AR')}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{o.courier ?? '—'}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{o.city ?? '—'}</span>
                  <select
                    value={o.status}
                    onChange={e => handleStatusChange(o.id, e.target.value as Order['status'])}
                    style={{ background: st.bg + '88', color: st.color, border: `1px solid ${st.color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="shipped">En camino</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}


