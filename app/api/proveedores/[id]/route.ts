import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/proveedores/[id]/notas  → agregar nota
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  const { id } = await params;

  const { text, type } = await req.json();
  if (!text) return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });

  const [row] = await query(
    `INSERT INTO supplier_notes (supplier_id, business_id, text, type) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, payload.businessId, text, type ?? 'info'],
  );
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  const { id } = await params;

  await query(`DELETE FROM suppliers WHERE id=$1 AND business_id=$2`, [id, payload.businessId]);
  return NextResponse.json({ ok: true });
}
