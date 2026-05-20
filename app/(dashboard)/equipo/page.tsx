'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

interface Collaborator {
  id: string;
  username: string;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

export default function EquipoPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', full_name: '', password: '', role: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/equipo');
    if (res.ok) {
      const data = await res.json();
      setCollaborators(data.collaborators ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCollaborators(); }, [loadCollaborators]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/equipo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Error al crear colaborador');
    } else {
      setSuccess(`Colaborador "${form.username}" creado correctamente.`);
      setForm({ username: '', full_name: '', password: '', role: '' });
      setShowForm(false);
      loadCollaborators();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`¿Eliminar al colaborador "${username}"?`)) return;
    const res = await fetch(`/api/equipo/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess(`"${username}" eliminado.`);
      setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1f2937', border: '1px solid #374151',
    color: '#e2e8f0', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
            🧑‍💼 Equipo
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Colaboradores con acceso al negocio
          </p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError(''); setSuccess(''); }}
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            border: 'none', color: 'white', padding: '10px 20px',
            borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Agregar colaborador'}
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <div style={{
          background: '#052e1688', border: '1px solid #22c55e33', color: '#4ade80',
          padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>
          ✅ {success}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: '#111827', border: '1px solid #1f2937',
          borderRadius: 16, padding: 24, marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
              Usuario <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              style={inputStyle}
              placeholder="juan_perez"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Nombre completo</label>
            <input
              style={inputStyle}
              placeholder="Juan Pérez"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
              Contraseña <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              style={inputStyle}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Rol</label>
            <input
              style={inputStyle}
              placeholder="ej: Vendedor, Deposito..."
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            />
          </div>

          {error && (
            <div style={{
              gridColumn: '1/-1',
              background: '#450a0a88', border: '1px solid #ef444433',
              color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ gridColumn: '1/-1' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#374151' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                border: 'none', color: 'white', padding: '11px 28px',
                borderRadius: 10, cursor: saving ? 'default' : 'pointer',
                fontWeight: 700, fontSize: 14,
              }}
            >
              {saving ? 'Guardando...' : 'Crear colaborador'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14, padding: 20 }}>Cargando...</div>
      ) : collaborators.length === 0 ? (
        <div style={{
          background: '#111827', border: '1px solid #1f2937', borderRadius: 16,
          padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            Todavía no hay colaboradores. Agregá el primero arriba.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {collaborators.map(c => (
            <div
              key={c.id}
              style={{
                background: '#111827', border: '1px solid #1f2937', borderRadius: 14,
                padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>
                    {c.full_name || c.username}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>@{c.username}</div>
                </div>
                {c.role && (
                  <span style={{
                    background: '#1f2937', border: '1px solid #374151',
                    color: '#9ca3af', padding: '3px 10px', borderRadius: 20, fontSize: 11,
                  }}>
                    {c.role}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(c.id, c.username)}
                style={{
                  background: '#1f2937', border: '1px solid #374151',
                  color: '#ef4444', padding: '7px 14px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
