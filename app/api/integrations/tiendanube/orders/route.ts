import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getIntegration } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const integration = await getIntegration(payload.businessId, 'tiendanube');
  if (!integration) return NextResponse.json({ error: 'No conectado' }, { status: 404 });

  const { access_token, external_id, meta } = integration;
  const tokenType = (meta as Record<string, string>).token_type ?? 'Bearer';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));

  const res = await fetch(
    `https://api.tiendanube.com/v1/${external_id}/orders?per_page=50&page=${page}&sort_by=id&sort_direction=desc`,
    {
      headers: {
        Authorization: `${tokenType} ${access_token}`,
        'User-Agent': 'GoEasy CRM (soporte@goeasyCRM.com)',
      },
    },
  );

  if (!res.ok) return NextResponse.json({ error: 'Error TiendaNube' }, { status: 502 });

  const linkHeader = res.headers.get('link') ?? '';
  const hasNext = linkHeader.includes('rel="next"');
  const total = res.headers.get('x-total-count') ? parseInt(res.headers.get('x-total-count')!, 10) : null;

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (Array.isArray(data) ? data : []).map((o: any) => ({
    id: o.id,
    number: o.number,
    date: o.created_at,
    status: o.status,
    payment_status: o.payment_status,
    total: parseFloat(o.total ?? '0'),
    currency: o.currency,
    customer: o.customer ? `${o.customer.name ?? ''} ${o.customer.lastname ?? ''}`.trim() : '—',
    email: o.contact_email ?? null,
    products_count: (o.products ?? []).length,
  }));

  return NextResponse.json({ orders, page, hasNext, total });
}
