import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const rows = await query(
    `SELECT provider, external_id, meta, updated_at FROM business_integrations WHERE business_id=$1`,
    [payload.businessId],
  );

  return NextResponse.json(rows);
}
