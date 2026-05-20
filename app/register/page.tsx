'use client'
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {

  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la cuenta.');
      setLoading(false);
    } else {
      // Recarga completa para que el middleware vea la cookie JWT
      window.location.href = '/onboarding';
    }
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
        maxWidth: 440,
        background: 'linear-gradient(145deg,#111827,#0f1623)',
        border: '1px solid #1f2937',
        borderRadius: 20,
        padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
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

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Crear cuenta</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>Empezá a gestionar tu negocio gratis</p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="Juan García"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
              }}
            />
          </div>

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
                color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repetí tu contraseña"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
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
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', marginTop: 16 }}>
          Al registrarte aceptás los términos de servicio de GoEasy CRM.
        </div>

        <div style={{
          marginTop: 24, paddingTop: 20, borderTop: '1px solid #1f2937',
          textAlign: 'center', fontSize: 13, color: '#6b7280',
        }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}


