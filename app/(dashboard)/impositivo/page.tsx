export const dynamic = 'force-dynamic'
export default function ImpositivoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg,#1e3a5f,#0d2137)',
        border: '1px solid #2d4a6a', borderRadius: 16, padding: 20,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 32 }}>📋</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Módulo ARCA (ex AFIP)</div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 4 }}>
            Próximamente: integración automática con ARCA/AFIP
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { title: '📄 Facturación electrónica', desc: 'Generar facturas A, B y C directamente desde el CRM.', color: '#3b82f6', badge: 'Próximamente' },
          { title: '📊 IVA mensual', desc: 'Resumen automático de IVA débito y crédito del mes.', color: '#8b5cf6', badge: 'Próximamente' },
          { title: '🗓 Vencimientos', desc: 'Alertas de vencimientos impositivos ARCA/IIBB/Ganancias.', color: '#f59e0b', badge: 'Próximamente' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 22 }}>{item.title.split(' ')[0]}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: item.color + '22', color: item.color, border: `1px solid ${item.color}44` }}>
                {item.badge}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', marginBottom: 6 }}>{item.title.slice(3)}</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Main placeholder */}
      <div className="card" style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔧</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>En desarrollo</div>
        <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Este módulo conectará con <strong style={{ color: '#93c5fd' }}>ARCA (ex AFIP)</strong> para traer IVA,
          Ingresos Brutos, Ganancias y vencimientos de forma automática.
          También incluirá emisión de facturas electrónicas y libro de IVA.
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <div style={{ padding: '6px 16px', borderRadius: 20, background: '#1f2937', border: '1px solid #374151', fontSize: 12, color: '#9ca3af' }}>
            💡 ¿Necesitás esta función? Escribinos para priorizarla.
          </div>
        </div>
      </div>
    </div>
  );
}

