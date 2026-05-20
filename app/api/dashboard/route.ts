import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

function bid(payload: ReturnType<typeof getTokenFromRequest>) {
  return payload?.businessId;
}

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sow = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const b = payload.businessId;

  const [ordersMonth, ordersToday, expenses, products, clients, ordersWeek] = await Promise.all([
    query(`SELECT total, status, created_at FROM orders WHERE business_id=$1 AND created_at>=$2`, [b, som]),
    query(`SELECT total FROM orders WHERE business_id=$1 AND created_at>=$2 AND status NOT IN ('cancelled')`, [b, tod]),
    query(`SELECT amount FROM expenses WHERE business_id=$1 AND date>=$2`, [b, som.slice(0,10)]),
    query(`SELECT stock, min_stock FROM products WHERE business_id=$1 AND active=true`, [b]),
    query(`SELECT id FROM clients WHERE business_id=$1`, [b]),
    query(`SELECT total, created_at FROM orders WHERE business_id=$1 AND created_at>=$2 AND status NOT IN ('cancelled')`, [b, sow]),
  ]);

  const ingresos = (ordersMonth as any[]).filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const ventasHoy = (ordersToday as any[]).reduce((s, o) => s + Number(o.total), 0);
  const gastosMes = (expenses as any[]).reduce((s, e) => s + Number(e.amount), 0);
  const lowStock = (products as any[]).filter(p => p.stock <= p.min_stock).length;

  // Ventas por día (últimos 7 días)
  const salesByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    salesByDay[d.toLocaleDateString('es-AR', { weekday: 'short' })] = 0;
  }
  for (const o of ordersWeek as any[]) {
    const d = new Date(o.created_at).toLocaleDateString('es-AR', { weekday: 'short' });
    if (d in salesByDay) salesByDay[d] += Number(o.total);
  }

  return NextResponse.json({
    ingresos,
    ventasHoy,
    gastosMes,
    margenNeto: ingresos - gastosMes,
    totalClientes: (clients as any[]).length,
    lowStock,
    salesByDay,
  });
}
