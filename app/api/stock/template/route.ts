import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const headers = [
    ['nombre *', 'sku', 'categoria', 'precio', 'costo', 'stock', 'stock_minimo', 'canales'],
    ['Zapatillas Running', 'ZAP-001', 'Calzado', 15000, 8000, 50, 10, 'tiendanube,mercadolibre'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(headers);

  // Column widths
  ws['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
    { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_productos.xlsx"',
    },
  });
}
