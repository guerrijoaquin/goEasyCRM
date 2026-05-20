-- ============================================================
-- GoEasy CRM — Migración inicial (multi-tenant con RLS)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type order_status as enum ('pending', 'shipped', 'delivered', 'cancelled');
create type expense_category as enum (
  'Envíos', 'Comisiones ML', 'Comisiones TN',
  'Publicidad', 'Packaging', 'Sueldos', 'Impuestos', 'Otros'
);
create type user_role as enum ('owner', 'admin', 'viewer');
create type note_type as enum ('info', 'warning', 'success');
create type plan_type as enum ('free', 'pro', 'enterprise');
create type campaign_status as enum ('active', 'paused', 'ended');

-- ── businesses (tenants) ─────────────────────────────────────
create table businesses (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  logo_url   text,
  plan       plan_type not null default 'free',
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ── business_users (miembros del tenant) ─────────────────────
create table business_users (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  unique(business_id, user_id)
);

-- ── products ─────────────────────────────────────────────────
create table products (
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
create table clients (
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
create table orders (
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

-- ── order_items ──────────────────────────────────────────────
create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  quantity    integer not null default 1,
  unit_price  numeric(12,2) not null default 0
);

-- ── expenses ─────────────────────────────────────────────────
create table expenses (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  category    expense_category not null default 'Otros',
  amount      numeric(12,2) not null,
  description text,
  date        date not null default current_date,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ── suppliers ────────────────────────────────────────────────
create table suppliers (
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

-- ── supplier_notes ───────────────────────────────────────────
create table supplier_notes (
  id          uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  text        text not null,
  type        note_type not null default 'info',
  created_at  timestamptz not null default now()
);

-- ── ad_campaigns ─────────────────────────────────────────────
create table ad_campaigns (
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

-- ── sales_channels ───────────────────────────────────────────
create table sales_channels (
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

-- ══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ══════════════════════════════════════════════════════════════

-- Función helper: devuelve los business_ids a los que pertenece el usuario
create or replace function get_my_business_ids()
returns setof uuid language sql security definer stable as $$
  select business_id from business_users where user_id = auth.uid()
$$;

-- businesses
alter table businesses enable row level security;
create policy "users see own businesses"
  on businesses for select using (id in (select get_my_business_ids()));
create policy "owner inserts"
  on businesses for insert with check (owner_id = auth.uid());
create policy "owner updates"
  on businesses for update using (owner_id = auth.uid());

-- business_users
alter table business_users enable row level security;
create policy "member sees own memberships"
  on business_users for select using (user_id = auth.uid() or business_id in (select get_my_business_ids()));
create policy "owner inserts members"
  on business_users for insert with check (business_id in (select get_my_business_ids()));
create policy "owner deletes members"
  on business_users for delete using (business_id in (select get_my_business_ids()));

-- products
alter table products enable row level security;
create policy "tenant product select" on products for select using (business_id in (select get_my_business_ids()));
create policy "tenant product insert" on products for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant product update" on products for update using (business_id in (select get_my_business_ids()));
create policy "tenant product delete" on products for delete using (business_id in (select get_my_business_ids()));

-- clients
alter table clients enable row level security;
create policy "tenant client select" on clients for select using (business_id in (select get_my_business_ids()));
create policy "tenant client insert" on clients for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant client update" on clients for update using (business_id in (select get_my_business_ids()));
create policy "tenant client delete" on clients for delete using (business_id in (select get_my_business_ids()));

-- orders
alter table orders enable row level security;
create policy "tenant order select" on orders for select using (business_id in (select get_my_business_ids()));
create policy "tenant order insert" on orders for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant order update" on orders for update using (business_id in (select get_my_business_ids()));
create policy "tenant order delete" on orders for delete using (business_id in (select get_my_business_ids()));

-- order_items
alter table order_items enable row level security;
create policy "tenant order_items select" on order_items for select
  using (order_id in (select id from orders where business_id in (select get_my_business_ids())));
create policy "tenant order_items insert" on order_items for insert
  with check (order_id in (select id from orders where business_id in (select get_my_business_ids())));
create policy "tenant order_items delete" on order_items for delete
  using (order_id in (select id from orders where business_id in (select get_my_business_ids())));

-- expenses
alter table expenses enable row level security;
create policy "tenant expense select" on expenses for select using (business_id in (select get_my_business_ids()));
create policy "tenant expense insert" on expenses for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant expense update" on expenses for update using (business_id in (select get_my_business_ids()));
create policy "tenant expense delete" on expenses for delete using (business_id in (select get_my_business_ids()));

-- suppliers
alter table suppliers enable row level security;
create policy "tenant supplier select" on suppliers for select using (business_id in (select get_my_business_ids()));
create policy "tenant supplier insert" on suppliers for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant supplier update" on suppliers for update using (business_id in (select get_my_business_ids()));
create policy "tenant supplier delete" on suppliers for delete using (business_id in (select get_my_business_ids()));

-- supplier_notes
alter table supplier_notes enable row level security;
create policy "tenant note select" on supplier_notes for select using (business_id in (select get_my_business_ids()));
create policy "tenant note insert" on supplier_notes for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant note delete" on supplier_notes for delete using (business_id in (select get_my_business_ids()));

-- ad_campaigns
alter table ad_campaigns enable row level security;
create policy "tenant campaign select" on ad_campaigns for select using (business_id in (select get_my_business_ids()));
create policy "tenant campaign insert" on ad_campaigns for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant campaign update" on ad_campaigns for update using (business_id in (select get_my_business_ids()));
create policy "tenant campaign delete" on ad_campaigns for delete using (business_id in (select get_my_business_ids()));

-- sales_channels
alter table sales_channels enable row level security;
create policy "tenant channel select" on sales_channels for select using (business_id in (select get_my_business_ids()));
create policy "tenant channel insert" on sales_channels for insert with check (business_id in (select get_my_business_ids()));
create policy "tenant channel update" on sales_channels for update using (business_id in (select get_my_business_ids()));
create policy "tenant channel delete" on sales_channels for delete using (business_id in (select get_my_business_ids()));

-- ── Indexes ──────────────────────────────────────────────────
create index on products(business_id);
create index on products(business_id, active);
create index on orders(business_id);
create index on orders(business_id, status);
create index on orders(business_id, created_at desc);
create index on clients(business_id);
create index on expenses(business_id);
create index on expenses(business_id, date desc);
create index on suppliers(business_id);
create index on supplier_notes(supplier_id);
create index on ad_campaigns(business_id);
create index on business_users(user_id);
create index on business_users(business_id);

-- ── updated_at trigger ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at before update on products for each row execute function update_updated_at();
create trigger trg_orders_updated_at   before update on orders   for each row execute function update_updated_at();
create trigger trg_clients_updated_at  before update on clients  for each row execute function update_updated_at();
create trigger trg_suppliers_updated_at before update on suppliers for each row execute function update_updated_at();
create trigger trg_campaigns_updated_at before update on ad_campaigns for each row execute function update_updated_at();
