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
    `https://api.tiendanube.com/v1/${external_id}/customers?per_page=50&page=${page}&sort_by=created_at&sort_direction=desc`,
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
  const customers = (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    name: `${c.name ?? ''} ${c.lastname ?? ''}`.trim() || '—',
    email: c.email ?? null,
    phone: c.phone ?? null,
    city: c.default_address?.city ?? null,
    province: c.default_address?.province ?? null,
    country: c.default_address?.country ?? null,
    total_spent: parseFloat(c.total_spent ?? '0'),
    orders_count: c.total_orders ?? 0,
    created_at: c.created_at,
    last_order_at: c.last_order_id ? c.updated_at : null,
  }));

  return NextResponse.json({ customers, page, hasNext, total });
}
