import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const data = await query(
    `SELECT s.*, json_agg(sn ORDER BY sn.created_at DESC) FILTER (WHERE sn.id IS NOT NULL) AS supplier_notes
     FROM suppliers s
     LEFT JOIN supplier_notes sn ON sn.supplier_id = s.id
     WHERE s.business_id=$1
     GROUP BY s.id ORDER BY s.created_at DESC`,
    [payload.businessId],
  );
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { name, contact, email, phone, category, balance } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const [row] = await query(
    `INSERT INTO suppliers (business_id, name, contact, email, phone, category, balance) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [payload.businessId, name, contact ?? null, email ?? null, phone ?? null, category ?? null, Number(balance) || 0],
  );
  return NextResponse.json({ ...row, supplier_notes: [] }, { status: 201 });
}
