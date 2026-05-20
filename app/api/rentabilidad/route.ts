import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const b = payload.businessId;

  const [orders, expenses] = await Promise.all([
    query(`SELECT total FROM orders WHERE business_id=$1 AND status IN ('delivered','shipped') AND created_at>=$2`, [b, startOfMonth]),
    query(`SELECT amount FROM expenses WHERE business_id=$1 AND date>=$2`, [b, startOfMonth]),
  ]);

  const ingresos = (orders as any[]).reduce((s, o) => s + Number(o.total), 0);
  const gastos = (expenses as any[]).reduce((s, e) => s + Number(e.amount), 0);

  return NextResponse.json({ ingresos, gastos });
}
