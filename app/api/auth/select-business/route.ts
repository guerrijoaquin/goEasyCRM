import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, signToken, cookieOptions } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = getTokenFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { businessId } = await req.json();
    if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

    console.log('[select-business] userId:', payload.userId, 'businessId:', businessId);

    // Verificar que el usuario pertenece a este negocio
    const membership = await queryOne<{ role: string }>(
      'SELECT role FROM business_users WHERE user_id=$1 AND business_id=$2',
      [payload.userId, businessId],
    );

    console.log('[select-business] membership found:', !!membership);

    if (!membership) return NextResponse.json({ error: 'Sin acceso a ese negocio' }, { status: 403 });

    // Strip JWT-internal fields (exp, iat) before re-signing to avoid conflicts
    const { userId, email, username, userType } = payload;
    const newToken = signToken({ userId, email, username, userType, businessId });
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: cookieOptions.name,
      value: newToken,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });
    console.log('[select-business] new token set, businessId in payload:', businessId);
    return res;
  } catch (err) {
    console.error('[select-business] error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
