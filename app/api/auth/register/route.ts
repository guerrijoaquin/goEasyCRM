import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { signToken, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await query<{ id: string; email: string }>(
      `INSERT INTO users (email, password_hash, full_name, user_type)
       VALUES ($1, $2, $3, 'owner') RETURNING id, email`,
      [email.toLowerCase().trim(), passwordHash, fullName],
    );

    const token = signToken({
      userId: user.id,
      email: user.email,
      username: null,
      userType: 'owner',
      businessId: null,
    });

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
    res.cookies.set({ ...cookieOptions, value: token });
    return res;
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
