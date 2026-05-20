import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, signToken, cookieOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { name, slug } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: 'Nombre y slug requeridos' }, { status: 400 });

    // Verificar slug único
    const existing = await queryOne('SELECT id FROM businesses WHERE slug = $1', [slug]);
    if (existing) return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 });

    const [business] = await query<{ id: string }>(
      `INSERT INTO businesses (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id`,
      [name, slug, payload.userId],
    );

    await query(
      `INSERT INTO business_users (business_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [business.id, payload.userId],
    );

    // Actualizar el token con el businessId
    const newToken = signToken({
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      userType: payload.userType,
      businessId: business.id,
    });
    const res = NextResponse.json({ ok: true, businessId: business.id });
    res.cookies.set({ ...cookieOptions, value: newToken });
    return res;
  } catch (err) {
    console.error('[onboarding]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
