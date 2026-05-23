import { NextRequest, NextResponse } from 'next/server';
import { upsertIntegration } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/integraciones?error=ml_denied`);
  }

  let businessId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    businessId = parsed.businessId;
  } catch {
    return NextResponse.redirect(`${appUrl}/integraciones?error=ml_state`);
  }

  // Intercambiar code por access_token
  const redirectUri = `${appUrl}/api/integrations/mercadolibre/callback`;
  const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error('[ml callback] token error:', await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/integraciones?error=ml_token`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in, user_id } = tokenData;

  // Obtener info del usuario ML
  let nickname = '';
  try {
    const userRes = await fetch(`https://api.mercadolibre.com/users/${user_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (userRes.ok) {
      const u = await userRes.json();
      nickname = u.nickname ?? '';
    }
  } catch { /* non-fatal */ }

  await upsertIntegration(businessId, 'mercadolibre', {
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000),
    external_id: String(user_id),
    meta: { nickname },
  });

  return NextResponse.redirect(`${appUrl}/integraciones/mercadolibre?connected=1`);
}
