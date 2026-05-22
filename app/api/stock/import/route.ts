import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'La planilla está vacía' }, { status: 400 });
  }

  const inserted: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row['nombre *'] ?? row['nombre'] ?? '').trim();
    if (!name) {
      errors.push(`Fila ${i + 2}: nombre es obligatorio`);
      continue;
    }

    const sku = String(row['sku'] ?? '').trim() || null;
    const category = String(row['categoria'] ?? '').trim() || null;
    const price = Number(row['precio']) || 0;
    const cost = Number(row['costo']) || 0;
    const stock = Number(row['stock']) || 0;
    const min_stock = Number(row['stock_minimo']) || 0;
    const channelsRaw = String(row['canales'] ?? '').trim();
    const channelsArr = channelsRaw
      ? `{${channelsRaw.split(',').map((c: string) => c.trim()).filter(Boolean).join(',')}}`
      : '{}';

    try {
      await query(
        `INSERT INTO products (business_id, name, sku, price, cost, stock, min_stock, category, channels)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (business_id, sku) DO UPDATE SET
           name=EXCLUDED.name, price=EXCLUDED.price, cost=EXCLUDED.cost,
           stock=EXCLUDED.stock, min_stock=EXCLUDED.min_stock,
           category=EXCLUDED.category, channels=EXCLUDED.channels`,
        [payload.businessId, name, sku, price, cost, stock, min_stock, category, channelsArr],
      );
      inserted.push(i + 2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Fila ${i + 2} (${name}): ${msg}`);
    }
  }

  return NextResponse.json({
    inserted: inserted.length,
    errors,
  });
}
