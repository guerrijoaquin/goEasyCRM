'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MLProduct { external_id: string; name: string; sku: string | null; price: number; stock: number; status: string; image_url: string | null; url: string | null; }
interface MLOrder { id: number; date: string; status: string; total: number; currency: string; buyer: string; items: Array<{ title: string; quantity: number; unit_price: number }>; }
interface MLQuestion { id: number; date: string; text: string; status: string; item_id: string; from: string; answer: string | null; answer_date: string | null; }
type Tab = 'productos' | 'ventas' | 'preguntas';

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pagado', color: '#22c55e' },
  pending: { label: 'Pendiente', color: '#f59e0b' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
  confirmed: { label: 'Confirmado', color: '#3b82f6' },
  payment_required: { label: 'Pago requerido', color: '#f59e0b' },
};

// ── Shared sub-components ──────────────────────────────────────────────────────
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0' }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ background: '#1f2937', border: '1px solid #374151', color: page <= 1 ? '#4b5563' : '#9ca3af', padding: '6px 14px', borderRadius: 8, cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13 }}>← Anterior</button>
      <span style={{ fontSize: 13, color: '#6b7280' }}>Pág. {page} / {pages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} style={{ background: '#1f2937', border: '1px solid #374151', color: page >= pages ? '#4b5563' : '#9ca3af', padding: '6px 14px', borderRadius: 8, cursor: page >= pages ? 'default' : 'pointer', fontSize: 13 }}>Siguiente →</button>
    </div>
  );
}
function Loading() { return <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0', fontSize: 14 }}>Cargando...</div>; }
function Empty({ msg }: { msg: string }) { return <div style={{ textAlign: 'center', color: '#4b5563', padding: '48px 0', fontSize: 13 }}>{msg}</div>; }

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MercadoLibrePage() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get('connected') === '1';

  const [integration, setIntegration] = useState<{ nickname: string } | null | undefined>(undefined);
  const [disconnecting, setDisconnecting] = useState(false);
  const [tab, setTab] = useState<Tab>('productos');

  const [products, setProducts] = useState<MLProduct[]>([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodPages, setProdPages] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const [loadingProd, setLoadingProd] = useState(false);

  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [ordPage, setOrdPage] = useState(1);
  const [ordPages, setOrdPages] = useState(1);
  const [ordTotal, setOrdTotal] = useState(0);
  const [loadingOrd, setLoadingOrd] = useState(false);

  const [questions, setQuestions] = useState<MLQuestion[]>([]);
  const [qPage, setQPage] = useState(1);
  const [qPages, setQPages] = useState(1);
  const [qTotal, setQTotal] = useState(0);
  const [loadingQ, setLoadingQ] = useState(false);

  useEffect(() => {
    fetch('/api/integrations').then(r => r.json()).then(data => {
      const ml = Array.isArray(data) ? data.find((i: { provider: string; meta?: { nickname?: string } }) => i.provider === 'mercadolibre') : null;
      setIntegration(ml ? { nickname: ml.meta?.nickname ?? '' } : null);
    }).catch(() => setIntegration(null));
  }, []);

  const loadProducts = useCallback(async (page: number) => {
    setLoadingProd(true);
    try {
      const r = await fetch(`/api/integrations/mercadolibre/products?page=${page}`);
      if (r.ok) { const d = await r.json(); setProducts(d.products ?? []); setProdTotal(d.total ?? 0); setProdPages(d.pages ?? 1); setProdPage(page); }
    } finally { setLoadingProd(false); }
  }, []);

  const loadOrders = useCallback(async (page: number) => {
    setLoadingOrd(true);
    try {
      const r = await fetch(`/api/integrations/mercadolibre/orders?page=${page}`);
      if (r.ok) { const d = await r.json(); setOrders(d.orders ?? []); setOrdTotal(d.total ?? 0); setOrdPages(d.pages ?? 1); setOrdPage(page); }
    } finally { setLoadingOrd(false); }
  }, []);

  const loadQuestions = useCallback(async (page: number) => {
    setLoadingQ(true);
    try {
      const r = await fetch(`/api/integrations/mercadolibre/questions?page=${page}`);
      if (r.ok) { const d = await r.json(); setQuestions(d.questions ?? []); setQTotal(d.total ?? 0); setQPages(d.pages ?? 1); setQPage(page); }
    } finally { setLoadingQ(false); }
  }, []);

  useEffect(() => {
    if (!integration) return;
    if (tab === 'productos' && products.length === 0) loadProducts(1);
    if (tab === 'ventas' && orders.length === 0) loadOrders(1);
    if (tab === 'preguntas' && questions.length === 0) loadQuestions(1);
  }, [tab, integration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Mercado Libre?')) return;
    setDisconnecting(true);
    await fetch('/api/integrations/mercadolibre/disconnect', { method: 'DELETE' });
    setIntegration(null); setProducts([]); setOrders([]); setQuestions([]);
    setDisconnecting(false);
  };

  const isConnected = integration !== null && integration !== undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header card */}
      <div style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: '1px solid #1f2937', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ffe600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🛒</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9' }}>Mercado Libre</div>
          {integration === undefined ? (
            <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3 }}>Verificando conexión...</div>
          ) : isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Conectado{integration.nickname ? ` como @${integration.nickname}` : ''}</span>
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
            <a href="/api/integrations/mercadolibre/auth" style={{ background: '#ffe600', color: '#1a1a1a', padding: '10px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              🔗 Conectar cuenta
            </a>
          )
        )}
      </div>

      {/* Success banner */}
      {justConnected && (
        <div style={{ background: '#052e1688', border: '1px solid #065f4655', borderRadius: 10, padding: '12px 16px', color: '#34d399', fontSize: 13 }}>
          ✅ ¡Cuenta conectada exitosamente!
        </div>
      )}

      {/* Not connected empty state */}
      {integration !== undefined && !isConnected && (
        <div style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: '1px solid #1f2937', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', marginBottom: 8 }}>Conectá tu cuenta de Mercado Libre</div>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 420, margin: '0 auto 24px' }}>Autorizá el acceso para consultar publicaciones, ventas y preguntas en tiempo real.</p>
          <a href="/api/integrations/mercadolibre/auth" style={{ background: '#ffe600', color: '#1a1a1a', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            🔗 Conectar Mercado Libre
          </a>
        </div>
      )}

      {/* Tabs */}
      {isConnected && (
        <>
          <div style={{ display: 'flex', gap: 4, background: '#0d1117', padding: 4, borderRadius: 12, border: '1px solid #1f2937' }}>
            {([
              { id: 'productos' as Tab, label: '📦 Publicaciones', total: prodTotal },
              { id: 'ventas' as Tab, label: '💰 Ventas', total: ordTotal },
              { id: 'preguntas' as Tab, label: '❓ Preguntas', total: qTotal },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(145deg,#111827,#0f1623)' : 'transparent', color: tab === t.id ? '#f1f5f9' : '#6b7280', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, transition: 'all 0.15s' }}>
                {t.label}{t.total > 0 && <span style={{ marginLeft: 5, fontSize: 11, color: tab === t.id ? '#60a5fa' : '#4b5563' }}>({t.total})</span>}
              </button>
            ))}
          </div>

          {/* Products */}
          {tab === 'productos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingProd ? <Loading /> : products.length === 0 ? <Empty msg="No hay publicaciones activas." /> : (
                <>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{prodTotal} publicaciones activas</div>
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
                        {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#eab308', textDecoration: 'none' }}>Ver en ML ↗</a>}
                      </div>
                    ))}
                  </div>
                  <Pagination page={prodPage} pages={prodPages} onPage={loadProducts} />
                </>
              )}
            </div>
          )}

          {/* Orders */}
          {tab === 'ventas' && (
            <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingOrd ? <Loading /> : orders.length === 0 ? <Empty msg="No hay ventas registradas." /> : (
                <>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{ordTotal} ventas encontradas</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 2fr 120px 100px', padding: '6px 12px', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    <span>Fecha</span><span>Comprador</span><span>Productos</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'center' }}>Estado</span>
                  </div>
                  {orders.map((o, i) => {
                    const st = ORDER_STATUSES[o.status] ?? { label: o.status, color: '#9ca3af' };
                    return (
                      <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 2fr 120px 100px', padding: '12px', alignItems: 'center', borderBottom: i < orders.length - 1 ? '1px solid #1f2937' : 'none' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(o.date).toLocaleDateString('es-AR')}</span>
                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{o.buyer}</span>
                        <span style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', paddingRight: 12 }}>{o.items.map(x => x.title).join(', ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', textAlign: 'right' }}>${Number(o.total).toLocaleString('es-AR')}</span>
                        <div style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: st.color + '22', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</span></div>
                      </div>
                    );
                  })}
                  <Pagination page={ordPage} pages={ordPages} onPage={loadOrders} />
                </>
              )}
            </div>
          )}

          {/* Questions */}
          {tab === 'preguntas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingQ ? <Loading /> : questions.length === 0 ? <Empty msg="No hay preguntas sin responder." /> : (
                <>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{qTotal} preguntas encontradas</div>
                  {questions.map(q => (
                    <div key={q.id} style={{ background: 'linear-gradient(145deg,#111827,#0f1623)', border: `1px solid ${q.answer ? '#1f2937' : '#92400e44'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.5, flex: 1 }}>{q.text}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0, background: q.answer ? '#22c55e22' : '#f59e0b22', color: q.answer ? '#22c55e' : '#f59e0b', border: `1px solid ${q.answer ? '#22c55e44' : '#f59e0b44'}` }}>
                          {q.answer ? 'Respondida' : 'Sin responder'}
                        </span>
                      </div>
                      {q.answer && (
                        <div style={{ background: '#0d1117', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#9ca3af', borderLeft: '2px solid #374151' }}>
                          <span style={{ fontSize: 11, color: '#4b5563', display: 'block', marginBottom: 4 }}>Tu respuesta:</span>
                          {q.answer}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                        <span>👤 {q.from}</span>
                        <span>📅 {new Date(q.date).toLocaleDateString('es-AR')}</span>
                        <a href={`https://www.mercadolibre.com.ar/p/${q.item_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#eab308', textDecoration: 'none' }}>Ver publicación ↗</a>
                      </div>
                    </div>
                  ))}
                  <Pagination page={qPage} pages={qPages} onPage={loadQuestions} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
