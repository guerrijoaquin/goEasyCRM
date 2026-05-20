import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTokenFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET /api/equipo → listar colaboradores del negocio actual
export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  if (payload.userType !== 'owner') return NextResponse.json({ error: 'Solo dueños' }, { status: 403 });

  const members = await query(
    `SELECT u.id, u.username, u.full_name, u.user_type, u.created_at, bu.role
     FROM users u
     JOIN business_users bu ON bu.user_id = u.id
     WHERE bu.business_id = $1 AND u.user_type = 'collaborator'
     ORDER BY u.created_at ASC`,
    [payload.businessId],
  );
  return NextResponse.json(members);
}

// POST /api/equipo → crear colaborador
export async function POST(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });
  if (payload.userType !== 'owner') return NextResponse.json({ error: 'Solo dueños' }, { status: 403 });

  const { username, fullName, password, role } = await req.json();
  if (!username || !password || !fullName) {
    return NextResponse.json({ error: 'Usuario, nombre y contraseña son requeridos' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  const existing = await queryOne(
    `SELECT id FROM users WHERE username = $1`,
    [username.toLowerCase().trim()],
  );
  if (existing) return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await query<{ id: string }>(
    `INSERT INTO users (username, password_hash, full_name, user_type)
     VALUES ($1, $2, $3, 'collaborator') RETURNING id`,
    [username.toLowerCase().trim(), passwordHash, fullName],
  );

  await query(
    `INSERT INTO business_users (business_id, user_id, role) VALUES ($1, $2, $3)`,
    [payload.businessId, user.id, role ?? 'viewer'],
  );

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
