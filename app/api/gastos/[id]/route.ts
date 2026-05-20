import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  const { id } = await params;
  await query(`DELETE FROM expenses WHERE id=$1 AND business_id=$2`, [id, payload.businessId]);
  return NextResponse.json({ ok: true });
}
