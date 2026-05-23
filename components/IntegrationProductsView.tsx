'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ExternalProduct {
  external_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  url: string | null;
}

interface Props {
  provider: 'mercadolibre' | 'tiendanube';
  providerName: string;
  accentColor: string;
  icon: string;
}

export default function IntegrationProductsView({ provider, providerName, accentColor, icon }: Props) {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get('connected') === '1';

  const [products, setProducts] = useState<ExternalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/integrations/${provider}/products`)
      .then(async r => {
        if (r.status === 404) { setNotConnected(true); setLoading(false); return; }
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(data => {
        if (data) setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [provider]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.external_id)));
    }
  };

  const handleImport = async (toImport: ExternalProduct[]) => {
    if (toImport.length === 0) return;
    setImporting(true);
    setImportResult(null);
    const res = await fetch(`/api/integrations/${provider}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: toImport }),
    });
    const data = await res.json();
    setImportResult(data);
    setImporting(false);
    setSelected(new Set());
  };

  if (notConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16 }}>
        <div style={{ fontSize: 48 }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>
          Cuenta de {providerName} no conectada
        </div>
        <p style={{ color: '#6b7280', fontSize: 13 }}>
          Conectá tu cuenta desde la sección de integraciones para importar productos.
        </p>
        <a
          href="/integraciones"
          style={{
            background: accentColor, color: '#fff', padding: '10px 22px',
            borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13,
          }}
        >
          Ir a integraciones
        </a>
      </div>
    );
  }

  const selectedProducts = products.filter(p => selected.has(p.external_id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 2px' }}>
            Productos de {providerName}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            {loading ? 'Cargando...' : `${products.length} productos encontrados`}
          </p>
        </div>
        <a href="/integraciones" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
          ← Integraciones
        </a>
      </div>

      {/* Alerta de conexión exitosa */}
      {justConnected && (
        <div style={{
          background: '#052e1688', border: '1px solid #065f4655', borderRadius: 10,
          padding: '12px 16px', color: '#34d399', fontSize: 13,
        }}>
          ✅ ¡{providerName} conectado exitosamente! Tus productos están listos para importar.
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div style={{
          background: importResult.errors.length > 0 ? '#451a0388' : '#052e1688',
          border: `1px solid ${importResult.errors.length > 0 ? '#92400e55' : '#065f4655'}`,
          borderRadius: 10, padding: '14px 18px',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: importResult.errors.length > 0 ? '#fbbf24' : '#34d399' }}>
            ✓ {importResult.inserted} producto{importResult.inserted !== 1 ? 's' : ''} importado{importResult.inserted !== 1 ? 's' : ''} al CRM
          </div>
          {importResult.errors.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#f87171' }}>
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} style={{ marginTop: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>Cerrar</button>
        </div>
      )}

      {/* Toolbar */}
      {!loading && products.length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar producto o SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, background: '#1f2937', border: '1px solid #374151',
              color: '#e2e8f0', padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
            }}
          />
          <button
            onClick={toggleAll}
            style={{
              background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {selected.size === filtered.length && filtered.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => handleImport(selectedProducts)}
              disabled={importing}
              style={{
                background: importing ? '#374151' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                border: 'none', color: 'white', padding: '8px 18px', borderRadius: 10,
                cursor: importing ? 'default' : 'pointer', fontWeight: 700, fontSize: 13,
              }}
            >
              {importing ? '⏳ Importando...' : `📥 Importar seleccionados (${selected.size})`}
            </button>
          )}
          <button
            onClick={() => handleImport(filtered)}
            disabled={importing || filtered.length === 0}
            style={{
              background: '#064e3b', border: '1px solid #065f46', color: '#34d399',
              padding: '8px 14px', borderRadius: 10, cursor: importing ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            📥 Importar todos ({filtered.length})
          </button>
        </div>
      )}

      {/* Grid de productos */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0', fontSize: 14 }}>
          Cargando productos desde {providerName}...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4b5563', padding: '40px 0', fontSize: 13 }}>
          No se encontraron productos.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const isSelected = selected.has(p.external_id);
            return (
              <div
                key={p.external_id}
                onClick={() => toggleSelect(p.external_id)}
                style={{
                  background: isSelected ? 'linear-gradient(145deg,#1e3a5f,#1a1033)' : 'linear-gradient(145deg,#111827,#0f1623)',
                  border: `1px solid ${isSelected ? accentColor + '88' : '#1f2937'}`,
                  borderRadius: 14, padding: 16, cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                {/* Checkbox + image */}
                <div style={{ position: 'relative' }}>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{ width: '100%', height: 140, objectFit: 'contain', borderRadius: 8, background: '#1f2937' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 140, borderRadius: 8, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      📦
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 22, height: 22, borderRadius: 6,
                    background: isSelected ? accentColor : '#374151',
                    border: `2px solid ${isSelected ? accentColor : '#4b5563'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: isSelected ? '#fff' : 'transparent',
                  }}>
                    ✓
                  </div>
                </div>

                {/* Info */}
                <div>
                  <div style={{
                    fontWeight: 600, fontSize: 13, color: '#f1f5f9', lineHeight: 1.3,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {p.name}
                  </div>
                  {p.sku && (
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontFamily: 'monospace' }}>
                      SKU: {p.sku}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
                    ${Number(p.price).toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontSize: 11, color: p.stock === 0 ? '#ef4444' : '#6b7280' }}>
                    Stock: {p.stock}
                  </span>
                </div>

                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}
                  >
                    Ver publicación ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
