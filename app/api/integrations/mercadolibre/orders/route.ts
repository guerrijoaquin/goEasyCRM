import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getIntegration } from '@/lib/integrations';

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const integration = await getIntegration(payload.businessId, 'mercadolibre');
  if (!integration) return NextResponse.json({ error: 'No conectado' }, { status: 404 });

  const { access_token, external_id } = integration;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const res = await fetch(
    `https://api.mercadolibre.com/orders/search?seller=${external_id}&sort=date_desc&offset=${offset}&limit=${PAGE_SIZE}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  if (!res.ok) return NextResponse.json({ error: 'Error al consultar MercadoLibre' }, { status: 502 });

  const data = await res.json();
  const total: number = data.paging?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (data.results ?? []).map((o: any) => ({
    id: o.id,
    date: o.date_created,
    status: o.status,
    total: o.total_amount,
    currency: o.currency_id,
    buyer: o.buyer?.nickname ?? '—',
    items: (o.order_items ?? []).map((i: any) => ({
      title: i.item?.title ?? '—',
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
  }));

  return NextResponse.json({ orders, total, page, pages });
}
