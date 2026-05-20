-- ============================================================
-- GoEasy CRM – Migración standalone (sin Supabase Auth)
-- Conexión directa PostgreSQL con autenticación JWT propia
-- Ejecutar ANTES de 001_initial.sql, o en lugar de él
-- ============================================================

-- ── Extensiones ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Tabla de usuarios propia (reemplaza auth.users) ─────────
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  password_hash text not null,
  full_name     text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Enums ────────────────────────────────────────────────────
do $$ begin
  create type order_status     as enum ('pending', 'shipped', 'delivered', 'cancelled');
  create type expense_category as enum ('Envíos','Comisiones ML','Comisiones TN','Publicidad','Packaging','Sueldos','Impuestos','Otros');
  create type user_role        as enum ('owner', 'admin', 'viewer');
  create type note_type        as enum ('info', 'warning', 'success');
  create type plan_type        as enum ('free', 'pro', 'enterprise');
  create type campaign_status  as enum ('active', 'paused', 'ended');
exception when duplicate_object then null; end $$;

-- ── businesses (tenants) ─────────────────────────────────────
create table if not exists businesses (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  logo_url   text,
  plan       plan_type not null default 'free',
  owner_id   uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ── business_users ───────────────────────────────────────────
create table if not exists business_users (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  unique(business_id, user_id)
);

-- ── products ─────────────────────────────────────────────────
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  sku         text,
  description text,
  price       numeric(12,2) not null default 0,
  cost        numeric(12,2) not null default 0,
  stock       integer not null default 0,
  min_stock   integer not null default 0,
  category    text,
  channels    text[] not null default '{}',
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── clients ──────────────────────────────────────────────────
create table if not exists clients (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  city          text,
  total_orders  integer not null default 0,
  total_spent   numeric(12,2) not null default 0,
  last_order_at timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── orders ───────────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references businesses(id) on delete cascade,
  client_id       uuid references clients(id) on delete set null,
  order_number    text not null,
  status          order_status not null default 'pending',
  total           numeric(12,2) not null default 0,
  channel         text not null default '',
  courier         text,
  tracking_number text,
  city            text,
  eta             text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── expenses ─────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  category    expense_category not null default 'Otros',
  amount      numeric(12,2) not null,
  description text,
  date        date not null default current_date,
  created_by  uuid not null references users(id),
  created_at  timestamptz not null default now()
);

-- ── suppliers ────────────────────────────────────────────────
create table if not exists suppliers (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  contact     text,
  email       text,
  phone       text,
  category    text,
  balance     numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── supplier_notes ────────────────────────────────────────────
create table if not exists supplier_notes (
  id          uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  text        text not null,
  type        note_type not null default 'info',
  created_at  timestamptz not null default now()
);

-- ── ad_campaigns ─────────────────────────────────────────────
create table if not exists ad_campaigns (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  status      campaign_status not null default 'active',
  platform    text not null default 'Meta Ads',
  budget      numeric(12,2) not null default 0,
  spent       numeric(12,2) not null default 0,
  roas        numeric(8,2),
  cpc         numeric(8,2),
  ctr         text,
  conversions integer not null default 0,
  start_date  date not null default current_date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── sales_channels ────────────────────────────────────────────
create table if not exists sales_channels (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  platform    text not null,
  color       text not null default '#3b82f6',
  icon        text not null default 'CH',
  sales       numeric(12,2) not null default 0,
  orders      integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Índices de performance ────────────────────────────────────
create index if not exists idx_orders_business_id     on orders(business_id);
create index if not exists idx_orders_created_at      on orders(created_at);
create index if not exists idx_clients_business_id    on clients(business_id);
create index if not exists idx_products_business_id   on products(business_id);
create index if not exists idx_expenses_business_date on expenses(business_id, date);
create index if not exists idx_business_users_user_id on business_users(user_id);
