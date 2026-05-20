import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'gocrm_token';
const JWT_SECRET  = process.env.JWT_SECRET ?? 'dev-secret-please-change';

export interface JWTPayload {
  userId:     string;
  email:      string | null;   // null para colaboradores (usan username)
  username:   string | null;   // null para owners
  userType:   'owner' | 'collaborator';
  businessId: string | null;
}

// ── Crear token ──────────────────────────────────────────────────────────────
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ── Verificar token ──────────────────────────────────────────────────────────
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ── Leer token de la request (API routes) ───────────────────────────────────
export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Leer token desde Server Component / Route Handler con next/headers ───────
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Cookie options reutilizables ─────────────────────────────────────────────
export const cookieOptions = {
  name:     COOKIE_NAME,
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   60 * 60 * 24 * 7, // 7 días
};
