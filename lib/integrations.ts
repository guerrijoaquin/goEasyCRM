import { queryOne, query } from '@/lib/db';

export interface IntegrationRow {
  id: string;
  business_id: string;
  provider: 'mercadolibre' | 'tiendanube';
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  external_id: string | null;
  meta: Record<string, unknown>;
  updated_at: string;
}

export async function getIntegration(
  businessId: string,
  provider: 'mercadolibre' | 'tiendanube',
): Promise<IntegrationRow | null> {
  return queryOne<IntegrationRow>(
    `SELECT * FROM business_integrations WHERE business_id=$1 AND provider=$2`,
    [businessId, provider],
  );
}

export async function upsertIntegration(
  businessId: string,
  provider: 'mercadolibre' | 'tiendanube',
  data: {
    access_token: string;
    refresh_token?: string | null;
    expires_at?: Date | null;
    external_id?: string | null;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  await query(
    `INSERT INTO business_integrations
       (business_id, provider, access_token, refresh_token, expires_at, external_id, meta, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,now())
     ON CONFLICT (business_id, provider) DO UPDATE SET
       access_token  = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at    = EXCLUDED.expires_at,
       external_id   = EXCLUDED.external_id,
       meta          = EXCLUDED.meta,
       updated_at    = now()`,
    [
      businessId,
      provider,
      data.access_token,
      data.refresh_token ?? null,
      data.expires_at ?? null,
      data.external_id ?? null,
      JSON.stringify(data.meta ?? {}),
    ],
  );
}

export async function deleteIntegration(
  businessId: string,
  provider: 'mercadolibre' | 'tiendanube',
): Promise<void> {
  await query(
    `DELETE FROM business_integrations WHERE business_id=$1 AND provider=$2`,
    [businessId, provider],
  );
}
