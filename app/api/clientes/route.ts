import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const data = await query(
    `SELECT * FROM clients WHERE business_id=$1 ORDER BY total_spent DESC`,
    [payload.businessId],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { name, email, phone, city, notes } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [row] = await query(
    `INSERT INTO clients (business_id, name, email, phone, city, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [payload.businessId, name, email ?? null, phone ?? null, city ?? null, notes ?? null],
  );
  return NextResponse.json(row, { status: 201 });
}
