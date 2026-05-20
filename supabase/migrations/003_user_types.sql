-- ============================================================
-- GoEasy CRM – Migración 003: Tipos de usuario y colaboradores
-- ============================================================

-- Agregar tipo de usuario y username a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'owner'
  CHECK (user_type IN ('owner', 'collaborator'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Los colaboradores tienen username obligatorio, los owners lo tienen null
-- Los owners tienen email obligatorio, los colaboradores pueden no tenerlo

-- Asegurarse que el role en business_users sea consistente
-- owner = rol 'owner' en business_users, collaborator = 'admin' o 'viewer'

COMMENT ON COLUMN users.user_type IS 'owner: dueño del negocio, collaborator: dado de alta por el dueño';
COMMENT ON COLUMN users.username IS 'Solo para colaboradores, se usa en lugar del email para login';
