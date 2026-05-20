import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const data = await query(
    `SELECT o.*, c.name AS client_name FROM orders o
     LEFT JOIN clients c ON c.id = o.client_id
     WHERE o.business_id=$1 ORDER BY o.created_at DESC LIMIT 100`,
    [payload.businessId],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { order_number, client_name, courier, city, channel, total, status, eta, notes } = await req.json();

  // Buscar o crear cliente por nombre
  let clientId: string | null = null;
  if (client_name) {
    const existing = await query<{ id: string }>(
      `SELECT id FROM clients WHERE business_id=$1 AND name ILIKE $2 LIMIT 1`,
      [payload.businessId, client_name],
    );
    if (existing[0]) {
      clientId = existing[0].id;
    } else {
      const [c] = await query<{ id: string }>(
        `INSERT INTO clients (business_id, name) VALUES ($1,$2) RETURNING id`,
        [payload.businessId, client_name],
      );
      clientId = c.id;
    }
  }

  const [row] = await query(
    `INSERT INTO orders (business_id, client_id, order_number, courier, city, channel, total, status, eta, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [payload.businessId, clientId, order_number, courier ?? null, city ?? null, channel ?? 'otro', Number(total) || 0, status ?? 'pending', eta ?? null, notes ?? null],
  );
  return NextResponse.json(row, { status: 201 });
}
