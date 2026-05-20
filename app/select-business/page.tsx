'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

export default function SelectBusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selectError, setSelectError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/businesses').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([bizData, meData]) => {
      setBusinesses(Array.isArray(bizData) ? bizData : []);
      if (meData?.user?.fullName) setUserName(meData.user.fullName);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSelect = async (businessId: string) => {
    setSelecting(businessId);
    setSelectError('');
    try {
      const res = await fetch('/api/auth/select-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json().catch(() => ({}));
        setSelectError(data.error ?? `Error al ingresar (${res.status})`);
        setSelecting(null);
      }
    } catch {
      setSelectError('Error de red al intentar ingresar.');
      setSelecting(null);
    }
  };

  const planLabel = (plan: string) =>
    plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : 'Free';

  const planColor = (plan: string) =>
    plan === 'pro' ? '#a855f7' : plan === 'enterprise' ? '#f59e0b' : '#22c55e';

  const roleLabel = (role: string) =>
    role === 'owner' ? 'Dueño' : role === 'admin' ? 'Admin' : 'Colaborador';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>⚡</div>
          {userName && (
            <p style={{ fontSize: 13, color: '#60a5fa', margin: '0 0 4px', fontWeight: 600 }}>
              👋 ¡Hola, {userName.split(' ')[0]}!
            </p>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' }}>
            ¿Qué negocio querés gestionar?
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Seleccioná uno de tus negocios o creá uno nuevo
          </p>
        </div>

        {selectError && (
          <div style={{
            background: '#450a0a88', border: '1px solid #ef444433',
            color: '#ef4444', padding: '10px 14px', borderRadius: 10,
            fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>
            ⚠ {selectError}
          </div>
        )}

        {/* Lista de negocios */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>
            Cargando negocios...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {businesses.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                disabled={!!selecting}
                style={{
                  background: selecting === b.id
                    ? 'linear-gradient(135deg,#1e3a5f,#2d1b69)'
                    : 'linear-gradient(145deg,#111827,#0f1623)',
                  border: selecting === b.id ? '1px solid #3b82f6' : '1px solid #1f2937',
                  borderRadius: 14,
                  padding: '18px 22px',
                  cursor: selecting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16,
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                  opacity: selecting && selecting !== b.id ? 0.5 : 1,
                }}
              >
                {/* Avatar negocio */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg,#1e3a5f,#2d1b69)',
                  border: '1px solid #2d4a6a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#60a5fa',
                }}>
                  {b.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 15, color: '#f1f5f9',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {b.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: planColor(b.plan) + '22', color: planColor(b.plan),
                      border: `1px solid ${planColor(b.plan)}44`,
                    }}>
                      {planLabel(b.plan)}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {roleLabel(b.role)}
                    </span>
                    <span style={{ fontSize: 11, color: '#374151' }}>·</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>/{b.slug}</span>
                  </div>
                </div>

                {/* Arrow / loading */}
                <div style={{ color: '#6b7280', fontSize: 18, flexShrink: 0 }}>
                  {selecting === b.id ? (
                    <span style={{ fontSize: 14, color: '#60a5fa' }}>Ingresando...</span>
                  ) : '→'}
                </div>
              </button>
            ))}

            {/* Crear nuevo negocio */}
            <button
              onClick={() => { window.location.href = '/onboarding'; }}
              disabled={!!selecting}
              style={{
                background: 'transparent',
                border: '1px dashed #374151',
                borderRadius: 14,
                padding: '16px 22px',
                cursor: selecting ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                textAlign: 'left', width: '100%',
                transition: 'all 0.2s',
                opacity: selecting ? 0.5 : 1,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                border: '1px dashed #374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                +
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#9ca3af' }}>Crear nuevo negocio</div>
                <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>Configurá un negocio adicional</div>
              </div>
            </button>
          </div>
        )}

        {/* Logout */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            style={{
              background: 'none', border: 'none', color: '#4b5563',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
