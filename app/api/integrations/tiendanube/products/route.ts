import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getIntegration } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const integration = await getIntegration(payload.businessId, 'tiendanube');
  if (!integration) return NextResponse.json({ error: 'No conectado a TiendaNube' }, { status: 404 });

  const { access_token, external_id, meta } = integration;
  const tokenType = (meta as Record<string, string>).token_type ?? 'Bearer';

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));

  const res = await fetch(
    `https://api.tiendanube.com/v1/${external_id}/products?per_page=30&page=${page}`,
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
  const products = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => {
    const variants = p.variants as Array<Record<string, unknown>> | undefined;
    const variant = variants?.[0];
    const images = p.images as Array<Record<string, unknown>> | undefined;
    const name = p.name as Record<string, string> | string | undefined;
    return {
      external_id: String(p.id),
      name: (typeof name === 'object' ? name?.es ?? name?.pt ?? '' : String(name ?? 'Sin nombre')),
      sku: (variant?.sku as string | null) ?? null,
      price: parseFloat(String(variant?.price ?? '0')),
      stock: (variant?.stock as number) ?? 0,
      image_url: (images?.[0]?.src as string | null) ?? null,
      url: (p.canonical_url as string | null) ?? null,
    };
  });

  return NextResponse.json({ products, page, hasNext, total });
}
