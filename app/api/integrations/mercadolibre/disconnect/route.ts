import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { deleteIntegration } from '@/lib/integrations';

export async function DELETE(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  await deleteIntegration(payload.businessId, 'mercadolibre');
  return NextResponse.json({ ok: true });
}
