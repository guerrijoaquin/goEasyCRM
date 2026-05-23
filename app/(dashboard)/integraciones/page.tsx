'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Integration {
  provider: 'mercadolibre' | 'tiendanube';
  external_id: string;
  meta: { nickname?: string; storeName?: string };
  updated_at: string;
}

const PROVIDERS = [
  {
    id: 'mercadolibre' as const,
    name: 'Mercado Libre',
    icon: '🛒',
    color: '#ffe600',
    textColor: '#1a1a1a',
    description: 'Importá tus publicaciones activas de MercadoLibre al CRM.',
    authPath: '/api/integrations/mercadolibre/auth',
    viewPath: '/integraciones/mercadolibre',
    disconnectPath: '/api/integrations/mercadolibre/disconnect',
    metaLabel: (meta: Integration['meta']) => meta.nickname ? `@${meta.nickname}` : 'Conectado',
  },
  {
    id: 'tiendanube' as const,
    name: 'Tienda Nube',
    icon: '☁️',
    color: '#00b1e1',
    textColor: '#fff',
    description: 'Sincronizá tu catálogo de TiendaNube directamente al CRM.',
    authPath: '/api/integrations/tiendanube/auth',
    viewPath: '/integraciones/tiendanube',
    disconnectPath: '/api/integrations/tiendanube/disconnect',
    metaLabel: (meta: Integration['meta']) => meta.storeName ? meta.storeName : 'Conectado',
  },
];

export default function IntegracionesPage() {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const errorParam = searchParams.get('error');

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(data => {
        setIntegrations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getConnected = (provider: string) =>
    integrations.find(i => i.provider === provider);

  const handleDisconnect = async (provider: string, disconnectPath: string) => {
    if (!confirm(`¿Desconectar ${provider}?`)) return;
    setDisconnecting(provider);
    await fetch(disconnectPath, { method: 'DELETE' });
    setIntegrations(prev => prev.filter(i => i.provider !== provider));
    setDisconnecting(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}>
          🔌 Integraciones
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Conectá tus canales de venta para importar productos y sincronizar datos.
        </p>
      </div>

      {/* Error banner */}
      {errorParam && (
        <div style={{
          background: '#450a0a88', border: '1px solid #ef444433', borderRadius: 10,
          padding: '12px 16px', color: '#ef4444', fontSize: 13,
        }}>
          ⚠ No se pudo conectar la cuenta. Verificá que las credenciales de la app estén configuradas correctamente.
          <span style={{ color: '#6b7280', marginLeft: 8 }}>({errorParam})</span>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {PROVIDERS.map(p => {
          const conn = getConnected(p.id);
          const isConnected = !!conn;

          return (
            <div key={p.id} style={{
              background: 'linear-gradient(145deg,#111827,#0f1623)',
              border: `1px solid ${isConnected ? p.color + '44' : '#1f2937'}`,
              borderRadius: 16, padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {/* Platform header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: p.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{p.name}</div>
                  {isConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                      <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                        {p.metaLabel(conn.meta)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>No conectado</div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                {p.description}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {isConnected ? (
                  <>
                    <a
                      href={p.viewPath}
                      style={{
                        flex: 1, background: 'linear-gradient(135deg,#1e3a5f,#2d1b69)',
                        border: '1px solid #3b82f655', color: '#60a5fa',
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        fontWeight: 600, fontSize: 13, textAlign: 'center', textDecoration: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      Ver productos →
                    </a>
                    <button
                      onClick={() => handleDisconnect(p.id, p.disconnectPath)}
                      disabled={disconnecting === p.id}
                      style={{
                        background: 'transparent', border: '1px solid #374151',
                        color: '#6b7280', padding: '9px 12px', borderRadius: 10,
                        cursor: 'pointer', fontSize: 12,
                      }}
                    >
                      {disconnecting === p.id ? '...' : 'Desconectar'}
                    </button>
                  </>
                ) : (
                  <a
                    href={loading ? '#' : p.authPath}
                    style={{
                      flex: 1, background: p.color,
                      border: 'none', color: p.textColor,
                      padding: '10px 14px', borderRadius: 10, cursor: loading ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: 13, textAlign: 'center', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    🔗 Conectar {p.name}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info section */}
      <div style={{
        background: '#0d1117', border: '1px solid #1f2937', borderRadius: 14,
        padding: '20px 24px', marginTop: 8,
      }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', marginBottom: 12 }}>
          📋 ¿Cómo funciona?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            '1. Hacé clic en "Conectar" y autorizá el acceso desde tu cuenta.',
            '2. GoEasy leerá tus productos publicados de forma segura (solo lectura).',
            '3. Importá los productos que quieras con un clic al inventario de tu CRM.',
          ].map((step, i) => (
            <div key={i} style={{ fontSize: 13, color: '#9ca3af' }}>{step}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
