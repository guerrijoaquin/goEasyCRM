import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, loginType } = body;

    console.log('[login] loginType:', loginType, '| email:', email, '| username:', username);

    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    let user: { id: string; email: string | null; username: string | null; password_hash: string; full_name: string; user_type: string } | null = null;

    if (loginType === 'collaborator') {
      // Colaborador: login con username
      if (!username) return NextResponse.json({ error: 'Nombre de usuario requerido' }, { status: 400 });
      user = await queryOne(
        `SELECT id, email, username, password_hash, full_name, user_type
         FROM users WHERE username = $1 AND user_type = 'collaborator'`,
        [username.toLowerCase().trim()],
      );
    } else {
      // Dueño: login con email
      if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
      user = await queryOne(
        `SELECT id, email, username, password_hash, full_name, user_type
         FROM users WHERE email = $1 AND user_type = 'owner'`,
        [email.toLowerCase().trim()],
      );
    }

    console.log('[login] user found:', !!user, '| user_type:', user?.user_type);

    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    console.log('[login] password match:', passwordOk);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (loginType === 'collaborator') {
      // Colaborador → va directo a su negocio
      const bu = await queryOne<{ business_id: string }>(
        'SELECT business_id FROM business_users WHERE user_id = $1 LIMIT 1',
        [user.id],
      );
      const token = signToken({
        userId: user.id,
        email: null,
        username: user.username,
        userType: 'collaborator',
        businessId: bu?.business_id ?? null,
      });
      console.log('[login] collaborator token created, length:', token.length);
      const res = NextResponse.json({
        ok: true,
        userType: 'collaborator',
        businessId: bu?.business_id ?? null,
      });
      res.cookies.set('gocrm_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log('[login] cookie set on response');
      return res;
    } else {
      // Owner → siempre va al selector de negocio (sin businessId en el token aún)
      const token = signToken({
        userId: user.id,
        email: user.email,
        username: null,
        userType: 'owner',
        businessId: null,  // se seteará al seleccionar negocio
      });
      console.log('[login] owner token created, length:', token.length);
      const res = NextResponse.json({
        ok: true,
        userType: 'owner',
        businessId: null,
      });
      res.cookies.set('gocrm_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      console.log('[login] cookie set on response');
      return res;
    }
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}