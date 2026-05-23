-- ============================================================
-- GoEasy CRM – Migración 004: Integraciones OAuth (ML + TiendaNube)
-- ============================================================

CREATE TABLE IF NOT EXISTS business_integrations (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider       text NOT NULL CHECK (provider IN ('mercadolibre', 'tiendanube')),
  access_token   text NOT NULL,
  refresh_token  text,
  expires_at     timestamptz,
  -- MercadoLibre: user_id numérico, TiendaNube: store_id numérico
  external_id    text,
  -- Datos extra (nickname ML, nombre tienda TN, etc.)
  meta           jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider)
);

COMMENT ON TABLE business_integrations IS 'Tokens OAuth por negocio y plataforma';
