'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TNProduct { external_id: string; name: string; sku: string | null; price: number; stock: number; image_url: string | null; url: string | null; }
interface TNOrder { id: number; number: string; date: string; status: string; payment_status: string; total: number; currency: string; customer: string; email: string | null; products_count: number; }
interface TNCustomer { id: number; name: string; email: string | null; phone: string | null; city: string | null; province: string | null; country: string | null; total_spent: number; orders_count: number; created_at: string; }
type Tab = 'productos' | 'ventas' | 'clientes';

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierta', color: '#3b82f6' },
  closed: { label: 'Completada', color: '#22c55e' },
  cancelled: { label: 'Cancelada', color: '#ef4444' },
  abandoned: { label: 'Abandonada', color: '#f59e0b' },
};
const PAYMENT_STATUSES: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pagado', color: '#22c55e' },
  pending: { label: 'Pendiente', color: '#f59e0b' },
  voided: { label: 'Anulado', color: '#ef4444' },
  authorized: { label: 'Autorizado', color: '#3b82f6' },
};

// ── Shared sub-components ──────────────────────────────────────────────────────
function Pagination({ page, hasNext, onPage }: { page: number; hasNext: boolean; onPage: (p: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0' }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ background: '#1f2937', border: '1px solid #374151', color: page <= 1 ? '#4b5563' : '#9ca3af', padding: '6px 14px', borderRadius: 8, cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13 }}>← Anterior</button>
      <span style={{ fontSize: 13, color: '#6b7280' }}>Página {page}</span>
      <button onClick={() => onPage(page + 1)} disabled={!hasNext} style={{ background: '#1f2937', border: '1px solid #374151', color: !hasNext ? '#4b5563' : '#9ca3af', padding: '6px 14px', borderRadius: 8, cursor: !hasNext ? 'default' : 'pointer', fontSize: 13 }}>Siguiente →</button>
    </div>
  );
}
function Loading() { return <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0', fontSize: 14 }}>Cargando...</div>; }
function Empty({ msg }: { msg: string }) { return <div style={{ textAlign: 'center', color: '#4b5563', padding: '48px 0', fontSize: 13 }}>{msg}</div>; }

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TiendaNubePage() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get('connected') === '1';

  const [integration, setIntegration] = useState<{ storeName: string } | null | undefined>(undefined);
  const [disconnecting, setDisconnecting] = useState(false);
  const [tab, setTab] = useState<Tab>('productos');

  const [products, setProducts] = useState<TNProduct[]>([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodHasNext, setProdHasNext] = useState(false);
  const [prodTotal, setProdTotal] = useState<number | null>(null);
  const [loadingProd, setLoadingProd] = useState(false);

  const [orders, setOrders] = useState<TNOrder[]>([]);
  const [ordPage, setOrdPage] = useState(1);
  const [ordHasNext, setOrdHasNext] = useState(false);
  const [ordTotal, setOrdTotal] = useState<number | null>(null);
  const [loadingOrd, setLoadingOrd] = useState(false);

  const [customers, setCustomers] = useState<TNCustomer[]>([]);
  const [custPage, setCustPage] = useState(1);
  const [custHasNext, setCustHasNext] = useState(false);
  const [custTotal, setCustTotal] = useState<number | null>(null);
  const [loadingCust, setLoadingCust] = useState(false);

  useEffect(() => {
    fetch('/api/integrations').then(r => r.json()).then(data => {
      const tn = Array.isArray(data) ? data.find((i: { provider: string; meta?: { storeName?: string } }) => i.provider === 'tiendanube') : null;
      setIntegration(tn ? { storeName: tn.meta?.storeName ?? '' } : null);
    }).catch(() => setIntegration(null));
  }, []);

  const loadProducts = useCallback(async (page: number) => {
    setLoadingProd(true);
    try {
      const r = await fetch(`/api/integrations/tiendanube/products?page=${page}`);
      if (r.ok) { const d = await r.json(); setProducts(d.products ?? []); setProdHasNext(d.hasNext ?? false); setProdTotal(d.total ?? null); setProdPage(page); }
    } finally { setLoadingProd(false); }
  }, []);

  const loadOrders = useCallback(async (page: number) => {
    setLoadingOrd(true);
    try {
      const r = await fetch(`/api/integrations/tiendanube/orders?page=${page}`);
      if (r.ok) { const d = await r.json(); setOrders(d.orders ?? []); setOrdHasNext(d.hasNext ?? false); setOrdTotal(d.total ?? null); setOrdPage(page); }
    } finally { setLoadingOrd(false); }
  }, []);

  const loadCustomers = useCallback(async (page: number) => {
    setLoadingCust(true);
    try {
      const r = await fetch(`/api/integrations/tiendanube/customers?page=${page}`);
      if (r.ok) { const d = await r.json(); setCustomers(d.customers ?? []); setCustHasNext(d.hasNext ?? false); setCustTotal(d.total ?? null); setCustPage(page); }
    } finally { setLoadingCust(false); }
  }, []);

  useEffect(() => {
    if (!integration) return;
    if (tab === 'productos' && products.length === 0) loadProducts(1);
    if (tab === 'ventas' && orders.length === 0) loadOrders(1);
    if (tab === 'clientes' && customers.length === 0) loadCustomers(1);
  }, [tab, integration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Tienda Nube?')) return;
    setDisconnecting(true);
    await fetch('/api/integrations/tiendanube/disconnect', { method: 'DELETE' });
    setIntegration(null); setProducts([]); setOrders([]); setCustomers([]);
    setDisconnecting(false);
  };

  const isConnected = integration !== null && integration !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header card */}
      <div style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: '1px solid #1f2937', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#00b1e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>☁️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9' }}>Tienda Nube</div>
          {integration === undefined ? (
            <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3 }}>Verificando conexión...</div>
          ) : isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Conectado{integration.storeName ? ` — ${integration.storeName}` : ''}</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>No conectado</div>
          )}
        </div>
        {integration !== undefined && (
          isConnected ? (
            <button onClick={handleDisconnect} disabled={disconnecting} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          ) : (
            <a href="/api/integrations/tiendanube/auth" style={{ background: '#00b1e1', color: '#fff', padding: '10px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              🔗 Conectar cuenta
            </a>
          )
        )}
      </div>

      {/* Success banner */}
      {justConnected && (
        <div style={{ background: '#052e1688', border: '1px solid #065f4655', borderRadius: 10, padding: '12px 16px', color: '#34d399', fontSize: 13 }}>
          ✅ ¡Tienda Nube conectada exitosamente!
        </div>
      )}

      {/* Not connected empty state */}
      {integration !== undefined && !isConnected && (
        <div style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: '1px solid #1f2937', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>☁️</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', marginBottom: 8 }}>Conectá tu Tienda Nube</div>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 420, margin: '0 auto 24px' }}>Autorizá el acceso para consultar productos y pedidos en tiempo real.</p>
          <a href="/api/integrations/tiendanube/auth" style={{ background: '#00b1e1', color: '#fff', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            🔗 Conectar Tienda Nube
          </a>
        </div>
      )}

      {/* Tabs */}
      {isConnected && (
        <>
          <div style={{ display: 'flex', gap: 4, background: '#0d1117', padding: 4, borderRadius: 12, border: '1px solid #1f2937' }}>
            {([
              { id: 'productos' as Tab, label: '📦 Productos', total: prodTotal },
              { id: 'ventas' as Tab, label: '💰 Pedidos', total: ordTotal },
              { id: 'clientes' as Tab, label: '👥 Clientes', total: custTotal },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(145deg,#111827,#0f1623)' : 'transparent', color: tab === t.id ? '#f1f5f9' : '#6b7280', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, transition: 'all 0.15s' }}>
                {t.label}{t.total !== null && t.total > 0 && <span style={{ marginLeft: 5, fontSize: 11, color: tab === t.id ? '#00b1e1' : '#4b5563' }}>({t.total})</span>}
              </button>
            ))}
          </div>

          {/* Products */}
          {tab === 'productos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingProd ? <Loading /> : products.length === 0 ? <Empty msg="No se encontraron productos." /> : (
                <>
                  {prodTotal !== null && <div style={{ fontSize: 12, color: '#6b7280' }}>{prodTotal} productos encontrados</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                    {products.map(p => (
                      <div key={p.external_id} style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: '1px solid #1f2937', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 130, objectFit: 'contain', borderRadius: 8, background: '#1f2937' }} />
                          : <div style={{ height: 130, borderRadius: 8, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>📦</div>
                        }
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                        {p.sku && <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>SKU: {p.sku}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>${Number(p.price).toLocaleString('es-AR')}</span>
                          <span style={{ fontSize: 11, color: p.stock === 0 ? '#ef4444' : '#6b7280' }}>Stock: {p.stock}</span>
                        </div>
                        {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#00b1e1', textDecoration: 'none' }}>Ver en TN ↗</a>}
                      </div>
                    ))}
                  </div>
                  <Pagination page={prodPage} hasNext={prodHasNext} onPage={loadProducts} />
                </>
              )}
            </div>
          )}

          {/* Orders */}
          {tab === 'ventas' && (
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingOrd ? <Loading /> : orders.length === 0 ? <Empty msg="No hay pedidos registrados." /> : (
                <>
                  {ordTotal !== null && <div style={{ fontSize: 12, color: '#6b7280' }}>{ordTotal} pedidos encontrados</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 110px 1fr 1fr 110px 110px', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <span>#</span><span>Fecha</span><span>Cliente</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'center' }}>Estado</span><span style={{ textAlign: 'center' }}>Pago</span>
                  </div>
                  {orders.map((o, i) => {
                    const st = ORDER_STATUSES[o.status] ?? { label: o.status, color: '#9ca3af' };
                    const py = PAYMENT_STATUSES[o.payment_status] ?? { label: o.payment_status, color: '#9ca3af' };
                    return (
                      <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '80px 110px 1fr 1fr 110px 110px', padding: '12px', alignItems: 'center', borderBottom: i < orders.length - 1 ? '1px solid #1f2937' : 'none' }}>
                        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>#{o.number || o.id}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(o.date).toLocaleDateString('es-AR')}</span>
                        <div>
                          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{o.customer}</div>
                          {o.email && <div style={{ fontSize: 11, color: '#6b7280' }}>{o.email}</div>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', textAlign: 'right' }}>${Number(o.total).toLocaleString('es-AR')}</span>
                        <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: st.color + '22', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</span></div>
                        <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: py.color + '22', color: py.color, border: `1px solid ${py.color}44` }}>{py.label}</span></div>
                      </div>
                    );
                  })}
                  <Pagination page={ordPage} hasNext={ordHasNext} onPage={loadOrders} />
                </>
              )}
            </div>
          )}

          {/* Customers */}
          {tab === 'clientes' && (
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingCust ? <Loading /> : customers.length === 0 ? <Empty msg="No hay clientes registrados." /> : (
                <>
                  {custTotal !== null && <div style={{ fontSize: 12, color: '#6b7280' }}>{custTotal} clientes encontrados</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 100px', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <span>Nombre</span><span>Email</span><span>Ubicación</span><span style={{ textAlign: 'right' }}>Total gastado</span><span style={{ textAlign: 'center' }}>Órdenes</span>
                  </div>
                  {customers.map((c, i) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 100px', padding: '12px', alignItems: 'center', borderBottom: i < customers.length - 1 ? '1px solid #1f2937' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{c.name}</div>
                        {c.phone && <div style={{ fontSize: 11, color: '#6b7280' }}>{c.phone}</div>}
                      </div>
                      <span style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{c.email ?? '—'}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{[c.city, c.province].filter(Boolean).join(', ') || '—'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', textAlign: 'right' }}>${Number(c.total_spent).toLocaleString('es-AR')}</span>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#1f2937', color: '#9ca3af', border: '1px solid #374151' }}>{c.orders_count}</span>
                      </div>
                    </div>
                  ))}
                  <Pagination page={custPage} hasNext={custHasNext} onPage={loadCustomers} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
