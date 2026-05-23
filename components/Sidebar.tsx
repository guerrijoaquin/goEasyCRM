'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Business } from '@/lib/types';

interface SidebarProps {
  business: Business | null;
  stockAlerts?: number;
  userType?: 'owner' | 'collaborator';
}

const tabs = [
  { id: 'dashboard',      href: '/dashboard',      label: 'Dashboard',     icon: '⊞' },
  { id: 'stock',          href: '/stock',          label: 'Stock',         icon: '📦' },
  { id: 'envios',         href: '/envios',         label: 'Pedidos',       icon: '🚚' },
  { id: 'clientes',       href: '/clientes',       label: 'Clientes',      icon: '👥' },
  { id: 'gastos',         href: '/gastos',         label: 'Gastos',        icon: '💸' },
  { id: 'rentabilidad',   href: '/rentabilidad',   label: 'Rentabilidad',  icon: '📈' },
  { id: 'proveedores',    href: '/proveedores',    label: 'Proveedores',   icon: '🤝' },
  { id: 'publicidad',     href: '/publicidad',     label: 'Publicidad',    icon: '📣' },
  { id: 'impositivo',     href: '/impositivo',     label: 'ARCA',          icon: '📋' },
  { id: 'integraciones',  href: '/integraciones',  label: 'Integraciones', icon: '🔌' },
];

export default function Sidebar({ business, stockAlerts = 0, userType }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div style={{
      width: 220,
      background: '#0d1117',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      height: '100vh',
      zIndex: 10,
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: '#f1f5f9' }}>GoEasy CRM</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>para Pymes</div>
          </div>
        </div>
      </div>

      {/* Business info */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f2937' }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Empresa</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{business?.name || '—'}</div>
        <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulseDot 2s infinite' }}></span>
          Plan {business?.plan === 'pro' ? 'Pro' : business?.plan === 'enterprise' ? 'Enterprise' : 'Free'} · Activo
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {tabs.map(t => {
          const isActive = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
          return (
            <Link
              key={t.id}
              href={t.href}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: isActive ? '#60a5fa' : '#9ca3af',
                fontSize: 13, fontWeight: 500,
                marginBottom: 2, textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              {t.label}
              {t.id === 'stock' && stockAlerts > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#ef4444', color: 'white', borderRadius: '50%',
                  width: 18, height: 18, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 10, fontWeight: 700,
                }}>
                  {stockAlerts}
                </span>
              )}
            </Link>
          );
        })}

        {/* Equipo — solo owners */}
        {userType === 'owner' && (() => {
          const isActive = pathname === '/equipo';
          return (
            <Link
              href="/equipo"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: isActive ? '#60a5fa' : '#9ca3af',
                fontSize: 13, fontWeight: 500,
                marginBottom: 2, textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>🧑‍💼</span>
              Equipo
            </Link>
          );
        })()}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {userType === 'owner' && (
          <button
            onClick={() => { window.location.href = '/select-business'; }}
            style={{
              width: '100%', background: 'transparent', border: '1px solid #1f2937',
              color: '#6b7280', padding: '8px', borderRadius: 8,
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            🔀 Cambiar negocio
          </button>
        )}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: '#1f2937', border: '1px solid #374151',
            color: '#9ca3af', padding: '8px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}
