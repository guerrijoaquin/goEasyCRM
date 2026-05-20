import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const businesses = await query(
    `SELECT b.id, b.name, b.slug, b.plan, b.logo_url, bu.role, b.created_at
     FROM businesses b
     JOIN business_users bu ON bu.business_id = b.id
     WHERE bu.user_id = $1
     ORDER BY b.created_at ASC`,
    [payload.userId],
  );

  return NextResponse.json(businesses);
}
