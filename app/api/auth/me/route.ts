import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const user = await queryOne<{ id: string; email: string; full_name: string }>(
    'SELECT id, email, full_name FROM users WHERE id = $1',
    [payload.userId],
  );
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.full_name, businessId: payload.businessId } });
}
