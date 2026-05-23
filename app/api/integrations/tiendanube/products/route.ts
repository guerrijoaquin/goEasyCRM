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

  const products = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) { // máx 5 páginas = 250 productos
    const res = await fetch(
      `https://api.tiendanube.com/v1/${external_id}/products?per_page=50&page=${page}`,
      {
        headers: {
          Authorization: `${tokenType} ${access_token}`,
          'User-Agent': 'GoEasy CRM (soporte@goeasyCRM.com)',
        },
      },
    );

    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) { hasMore = false; break; }

    for (const p of data) {
      const variant = p.variants?.[0];
      products.push({
        external_id: String(p.id),
        name: p.name?.es ?? p.name?.pt ?? p.name ?? 'Sin nombre',
        sku: variant?.sku ?? null,
        price: parseFloat(variant?.price ?? '0'),
        stock: variant?.stock ?? 0,
        image_url: p.images?.[0]?.src ?? null,
        url: p.canonical_url ?? null,
      });
    }

    hasMore = data.length === 50;
    page++;
  }

  return NextResponse.json(products);
}
