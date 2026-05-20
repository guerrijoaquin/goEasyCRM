import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const allowed = ['name', 'platform', 'budget', 'spent', 'roas', 'cpc', 'ctr', 'conversions', 'status', 'end_date'];
  const sets = Object.keys(body).filter(k => allowed.includes(k));
  if (!sets.length) return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 });

  const values = sets.map(k => body[k]);
  const sql = `UPDATE ad_campaigns SET ${sets.map((k, i) => `${k}=$${i + 1}`).join(', ')}, updated_at=now()
               WHERE id=$${sets.length + 1} AND business_id=$${sets.length + 2} RETURNING *`;

  const [row] = await query(sql, [...values, id, payload.businessId]);
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  const { id } = await params;
  await query(`DELETE FROM ad_campaigns WHERE id=$1 AND business_id=$2`, [id, payload.businessId]);
  return NextResponse.json({ ok: true });
}
