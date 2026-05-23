import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = getTokenFromRequest(req);
  if (!payload?.businessId) return NextResponse.redirect(new URL('/login', req.url));

  const clientId = process.env.TN_CLIENT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const state = Buffer.from(JSON.stringify({ businessId: payload.businessId })).toString('base64url');

  // TiendaNube OAuth2 authorization endpoint
  const authUrl = new URL(`https://www.tiendanube.com/apps/${clientId}/authorize`);
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
