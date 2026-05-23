import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { products } = await req.json() as {
    products: Array<{
      external_id: string;
      name: string;
      sku: string | null;
      price: number;
      stock: number;
      image_url: string | null;
    }>;
  };

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'Sin productos para importar' }, { status: 400 });
  }

  let inserted = 0;
  const errors: string[] = [];

  for (const p of products) {
    try {
      await query(
        `INSERT INTO products (business_id, name, sku, price, stock, image_url, channels)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [payload.businessId, p.name, p.sku ?? null, p.price, p.stock, p.image_url ?? null, '{mercadolibre}'],
      );
      inserted++;
    } catch (err: unknown) {
      errors.push(`${p.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ inserted, errors });
}
