'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect, useTransition } from 'react';
import type { Product } from '@/lib/types';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '', sku: '', price: '', cost: '', stock: '', min_stock: '', category: '', channels: 'tiendanube',
  });

  const fetchProducts = async () => {
    const res = await fetch('/api/stock');
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', sku: '', price: '', cost: '', stock: '', min_stock: '', category: '', channels: 'tiendanube' });
    setShowForm(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/stock/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(x => x.id !== id));
  };

  const alerts = products.filter(p => p.stock <= p.min_stock);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total alertas stock', value: alerts.length, icon: '⚠️', color: '#f59e0b' },
          { label: 'Sin stock', value: products.filter(p => p.stock === 0).length, icon: '🚫', color: '#ef4444' },
          { label: 'Stock crítico (≤5)', value: products.filter(p => p.stock > 0 && p.stock <= 5).length, icon: '📦', color: '#3b82f6' },
        ].map((k, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 28 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header + Botón */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Inventario de productos</div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            border: 'none', color: 'white', padding: '8px 18px',
            borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Agregar producto'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Nuevo producto</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Ej: Zapatillas Running', type: 'text' },
                { label: 'SKU', key: 'sku', placeholder: 'Ej: ZAP-001', type: 'text' },
                { label: 'Categoría', key: 'category', placeholder: 'Ej: Calzado', type: 'text' },
                { label: 'Precio ($)', key: 'price', placeholder: '0', type: 'number' },
                { label: 'Costo ($)', key: 'cost', placeholder: '0', type: 'number' },
                { label: 'Canal', key: 'channels', placeholder: '', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    required={f.key === 'name'}
                    className="form-input"
                    style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Stock inicial</label>
                <input type="number" placeholder="0" value={form.stock} onChange={e => setForm(x => ({ ...x, stock: e.target.value }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label className="form-label">Stock mínimo</label>
                <input type="number" placeholder="0" value={form.min_stock} onChange={e => setForm(x => ({ ...x, min_stock: e.target.value }))} style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#e2e8f0', padding: '8px 10px', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Guardar producto
            </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: '#f1f5f9' }}>Todos los productos</div>
        {loading ? (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</div>
        ) : products.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>
            No hay productos aún. ¡Agregá el primero!
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
              <span>Producto</span><span>SKU</span><span>Stock</span><span>Precio</span><span>Canal</span><span></span>
            </div>
            {products.map((p, i) => (
              <div key={p.id} className="row-item" style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px',
                padding: '12px 12px', alignItems: 'center',
                borderBottom: i < products.length - 1 ? '1px solid #1f2937' : 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{p.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'DM Mono,monospace' }}>{p.sku ?? '—'}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 18, color: p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#f59e0b' : '#22c55e' }}>{p.stock}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}> / mín {p.min_stock}</span>
                </div>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>${Number(p.price).toLocaleString('es-AR')}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(p.channels ?? []).map(c => (
                    <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: '#1f2937', color: '#9ca3af' }}>{c}</span>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 14 }}
                >✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


