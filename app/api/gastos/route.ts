import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const data = await query(
    `SELECT * FROM expenses WHERE business_id=$1 AND date>=$2 ORDER BY date DESC`,
    [payload.businessId, startOfMonth],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { category, amount, description, date } = await req.json();
  if (!amount) return NextResponse.json({ error: 'Monto requerido' }, { status: 400 });

  const [row] = await query(
    `INSERT INTO expenses (business_id, category, amount, description, date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [payload.businessId, category ?? 'Otros', Number(amount), description ?? null,
     date ?? new Date().toISOString().slice(0, 10), payload.userId],
  );
  return NextResponse.json(row, { status: 201 });
}
