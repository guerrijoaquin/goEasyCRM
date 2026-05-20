'use client';

import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/stock':        'Stock',
  '/envios':       'Pedidos & Envíos',
  '/clientes':     'Clientes',
  '/gastos':       'Gastos',
  '/rentabilidad': 'Rentabilidad',
  '/proveedores':  'Proveedores',
  '/publicidad':   'Publicidad',
  '/impositivo':   'ARCA / Impositivo',
};

interface TopbarProps {
  businessName?: string;
}

export default function Topbar({ businessName }: TopbarProps) {
  const pathname = usePathname();
  const label = LABELS[pathname] ?? 'Dashboard';

  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

  return (
    <div style={{
      height: 60,
      background: '#0d1117',
      borderBottom: '1px solid #1f2937',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>{label}</span>
        <span style={{ color: '#374151', fontSize: 13 }}>· {today}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {businessName && (
          <div style={{
            fontSize: 12, color: '#6b7280',
            background: '#111827', border: '1px solid #1f2937',
            padding: '4px 12px', borderRadius: 20,
          }}>
            {businessName}
          </div>
        )}
      </div>
    </div>
  );
}
