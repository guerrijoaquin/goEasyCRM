import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// DELETE /api/equipo/[id] → eliminar colaborador
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  if (payload.userType !== 'owner') return NextResponse.json({ error: 'Solo dueños' }, { status: 403 });

  const { id } = await params;

  // Quitar del negocio
  await query(
    `DELETE FROM business_users WHERE user_id=$1 AND business_id=$2`,
    [id, payload.businessId],
  );

  // Si ya no tiene ningún negocio, eliminar el usuario
  const other = await query(`SELECT id FROM business_users WHERE user_id=$1`, [id]);
  if (other.length === 0) {
    await query(`DELETE FROM users WHERE id=$1 AND user_type='collaborator'`, [id]);
  }

  return NextResponse.json({ ok: true });
}
