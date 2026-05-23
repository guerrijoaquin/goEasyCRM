import { NextRequest, NextResponse } from 'next/server';
import { upsertIntegration } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/integraciones?error=tn_denied`);
  }

  let businessId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    businessId = parsed.businessId;
  } catch {
    return NextResponse.redirect(`${appUrl}/integraciones?error=tn_state`);
  }

  const tokenRes = await fetch('https://www.tiendanube.com/apps/authorize/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TN_CLIENT_ID!,
      client_secret: process.env.TN_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!tokenRes.ok) {
    console.error('[tn callback] token error:', await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/integraciones?error=tn_token`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, token_type, user_id } = tokenData;

  // Obtener info de la tienda
  let storeName = '';
  try {
    const storeRes = await fetch(`https://api.tiendanube.com/v1/${user_id}/store`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
        'User-Agent': 'GoEasy CRM (soporte@goeasyCRM.com)',
      },
    });
    if (storeRes.ok) {
      const s = await storeRes.json();
      storeName = s.name?.es ?? s.name?.pt ?? '';
    }
  } catch { /* non-fatal */ }

  await upsertIntegration(businessId, 'tiendanube', {
    access_token,
    refresh_token: null,
    expires_at: null, // TiendaNube tokens no vencen
    external_id: String(user_id),
    meta: { storeName, token_type },
  });

  return NextResponse.redirect(`${appUrl}/integraciones/tiendanube?connected=1`);
}
