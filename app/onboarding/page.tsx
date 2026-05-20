'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';

export default function OnboardingPage() {

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (businessName) {
        setCheckingAvailability(true);
        try {
          const res = await fetch(`/api/check-business-name?name=${encodeURIComponent(businessName)}`);
          const data = await res.json();
          if (!res.ok) {
            setSlugError(data.error || 'Error checking availability.');
          } else {
            setSlugError('');
          }
        } catch (err) {
          setSlugError('Error checking availability.');
        } finally {
          setCheckingAvailability(false);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounce);
  }, [businessName]);

  const handleNameChange = (val: string) => {
    setBusinessName(val);
    const cleanSlug = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setSlug(cleanSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: businessName, slug }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.error?.includes('slug')) setSlugError(data.error);
      else setError(data.error ?? 'Error al crear el negocio.');
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
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
        maxWidth: 480,
        background: 'linear-gradient(145deg,#111827,#0f1623)',
        border: '1px solid #1f2937',
        borderRadius: 20,
        padding: '44px 40px',
      }}>
        {/* Logo + Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: '#f1f5f9' }}>GoEasy CRM</div>
            <div style={{ fontSize: 12, color: '#22c55e' }}>¡Cuenta creada! Configurá tu negocio.</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'linear-gradient(90deg,#3b82f6,#8b5cf6)' : '#1f2937',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              ¿Cómo se llama tu negocio?
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
              Esto aparecerá en tu CRM y podrás cambiarlo después.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ej: Sports Store, TechShop AR..."
                  style={{
                    width: '100%', background: '#1f2937', border: '1px solid #374151',
                    color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'block' }}>
                  URL del workspace
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#1f2937', border: `1px solid ${slugError ? '#ef4444' : '#374151'}`, borderRadius: 10, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 12px', fontSize: 13, color: '#4b5563', borderRight: '1px solid #374151', whiteSpace: 'nowrap' }}>
                    goeasyCRM.com/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    readOnly
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      color: '#e2e8f0', padding: '10px 14px', fontSize: 14, outline: 'none',
                    }}
                  />
                </div>
                {checkingAvailability && <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 4 }}>Verificando disponibilidad...</div>}
                {slugError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{slugError}</div>}
                {slug && !slugError && !checkingAvailability && (
                  <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>✓ Disponible</div>
                )}
              </div>
            </div>

            <button
              onClick={() => { if (businessName && slug) setStep(2); }}
              disabled={!businessName || !slug || checkingAvailability || !!slugError}
              style={{
                marginTop: 28, width: '100%',
                background: (!businessName || !slug || checkingAvailability || !!slugError) ? '#374151' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                border: 'none', color: 'white', padding: '12px', borderRadius: 10,
                cursor: (!businessName || !slug || checkingAvailability || !!slugError) ? 'default' : 'pointer',
                fontWeight: 700, fontSize: 15, transition: 'all 0.15s',
              }}
            >
              Continuar →
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              Todo listo 🎉
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
              Confirmá los datos de tu negocio.
            </p>

            {/* Summary */}
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #1f2937' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Nombre del negocio</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{businessName}</div>
              </div>
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #1f2937' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>URL del workspace</div>
                <div style={{ fontSize: 13, color: '#60a5fa', fontFamily: 'DM Mono, monospace' }}>goeasyCRM.com/{slug}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Plan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>Free</span>
                  <span style={{ fontSize: 11, color: '#4b5563' }}>— podés upgradear cuando quieras</span>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#450a0a88', border: '1px solid #ef444433',
                color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16,
              }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1, background: '#1f2937', border: '1px solid #374151',
                  color: '#9ca3af', padding: '12px', borderRadius: 10,
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                ← Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, background: loading ? '#374151' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  border: 'none', color: 'white', padding: '12px', borderRadius: 10,
                  cursor: loading ? 'default' : 'pointer', fontWeight: 700, fontSize: 15,
                }}
              >
                {loading ? 'Creando...' : '🚀 Crear mi CRM'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


