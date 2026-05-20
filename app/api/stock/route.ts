import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const data = await query(
    `SELECT * FROM products WHERE business_id=$1 AND active=true ORDER BY created_at DESC`,
    [payload.businessId],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { name, sku, price, cost, stock, min_stock, category, channels } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const channelsArr = channels ? `{${channels.split(',').map((c: string) => c.trim()).join(',')}}` : '{}';

  const [row] = await query(
    `INSERT INTO products (business_id, name, sku, price, cost, stock, min_stock, category, channels)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [payload.businessId, name, sku ?? null, Number(price) || 0, Number(cost) || 0,
     Number(stock) || 0, Number(min_stock) || 0, category ?? null, channelsArr],
  );
  return NextResponse.json(row, { status: 201 });
}
