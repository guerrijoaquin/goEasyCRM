import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const data = await query(
    `SELECT * FROM ad_campaigns WHERE business_id=$1 ORDER BY created_at DESC`,
    [payload.businessId],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { name, platform, budget, spent, roas, cpc, ctr, conversions, start_date, status } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [row] = await query(
    `INSERT INTO ad_campaigns (business_id, name, platform, budget, spent, roas, cpc, ctr, conversions, start_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [payload.businessId, name, platform ?? 'Meta Ads', Number(budget) || 0, Number(spent) || 0,
     roas ? Number(roas) : null, cpc ? Number(cpc) : null, ctr ?? null,
     Number(conversions) || 0, start_date ?? new Date().toISOString().slice(0, 10), status ?? 'active'],
  );
  return NextResponse.json(row, { status: 201 });
}
