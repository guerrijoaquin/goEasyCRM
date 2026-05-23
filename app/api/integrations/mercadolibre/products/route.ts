import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getIntegration } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const integration = await getIntegration(payload.businessId, 'mercadolibre');
  if (!integration) return NextResponse.json({ error: 'No conectado a MercadoLibre' }, { status: 404 });

  const { access_token, external_id } = integration;

  // Buscar todos los items activos del vendedor
  const searchRes = await fetch(
    `https://api.mercadolibre.com/users/${external_id}/items/search?status=active&limit=50`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );

  if (!searchRes.ok) {
    return NextResponse.json({ error: 'Error al consultar MercadoLibre' }, { status: 502 });
  }

  const searchData = await searchRes.json();
  const itemIds: string[] = searchData.results ?? [];

  if (itemIds.length === 0) {
    return NextResponse.json([]);
  }

  // Obtener detalles en batch (máx 20 por request)
  const chunks: string[][] = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    chunks.push(itemIds.slice(i, i + 20));
  }

  const products = [];
  for (const chunk of chunks) {
    const detailRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${chunk.join(',')}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    if (!detailRes.ok) continue;
    const details = await detailRes.json();
    for (const item of details) {
      if (item.code === 200 && item.body) {
        const b = item.body;
        products.push({
          external_id: b.id,
          name: b.title,
          sku: b.seller_sku ?? null,
          price: b.price ?? 0,
          stock: b.available_quantity ?? 0,
          image_url: b.thumbnail ?? null,
          url: b.permalink ?? null,
          category_id: b.category_id ?? null,
        });
      }
    }
  }

  return NextResponse.json(products);
}
