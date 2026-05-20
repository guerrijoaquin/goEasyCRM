'use client'
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

type LoginType = 'owner' | 'collaborator';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<LoginType>('owner');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const body = loginType === 'owner'
        ? { loginType: 'owner', email, password }
        : { loginType: 'collaborator', username, password };

      console.log('[login] Sending:', { loginType, email: loginType === 'owner' ? email : undefined, username: loginType === 'collaborator' ? username : undefined });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('[login] Response status:', res.status);
      const data = await res.json();
      console.log('[login] Response body:', data);

      if (!res.ok) {
        setError(data.error ?? 'Credenciales incorrectas.');
        setLoading(false);
      } else {
        const dest = data.businessId ? '/dashboard' : '/select-business';
        console.log('[login] Redirecting to:', dest);
        window.location.href = dest;
      }
    } catch (err) {
      console.error('[login] Unexpected error:', err);
      setError('Error inesperado. Revisá la consola del navegador.');
      setLoading(false);
    }
  };

  const switchType = (t: LoginType) => {
    setLoginType(t);
    setError('');
    setEmail('');
    setUsername('');
    setPassword('');
  };

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
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'linear-gradient(145deg,#111827,#0f1623)',
        border: '1px solid #1f2937',
        borderRadius: 20,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: '#f1f5f9' }}>GoEasy CRM</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Gestión inteligente para tu negocio</div>
          </div>
        </div>

        {/* Toggle owner / collaborator */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: '#0d1117', borderRadius: 12, padding: 4,
          marginBottom: 28, border: '1px solid #1f2937',
        }}>
          {(['owner', 'collaborator'] as LoginType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              style={{
                padding: '9px 0',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.2s',
                background: loginType === t ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'transparent',
                color: loginType === t ? '#fff' : '#6b7280',
              }}
            >
              {t === 'owner' ? '🏢 Dueño' : '👤 Colaborador'}
            </button>
          ))}
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          {loginType === 'owner' ? 'Iniciar sesión' : 'Acceso colaborador'}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22 }}>
          {loginType === 'owner'
            ? 'Ingresá con tu email y contraseña'
            : 'Ingresá con tu usuario y contraseña'}
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loginType === 'owner' ? (
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%', background: '#1f2937', border: '1px solid #374151',
                  color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="mi_usuario"
                style={{
                  width: '100%', background: '#1f2937', border: '1px solid #374151',
                  color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#450a0a88', border: '1px solid #ef444433',
              color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#374151' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              border: 'none', color: 'white', padding: '12px',
              borderRadius: 10, cursor: loading ? 'default' : 'pointer',
              fontWeight: 700, fontSize: 15, marginTop: 4,
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {loginType === 'owner' && (
          <div style={{
            marginTop: 28, paddingTop: 24, borderTop: '1px solid #1f2937',
            textAlign: 'center', fontSize: 13, color: '#6b7280',
          }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


