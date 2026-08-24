-- ============================================================
-- WZT Esport — schéma Supabase
-- À coller tel quel dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- Produits ajoutés depuis /admin
create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  cat text not null,
  front_img text,
  back_img text,
  price_id text,
  tag text,
  stock int,
  limited int,
  created_at timestamptz not null default now()
);

-- Commandes (créées "pending" au moment du checkout, passées "paid" au retour de Stripe)
create table if not exists public.orders (
  id text primary key,
  order_number int not null,
  email text not null,
  shipping jsonb not null,
  items jsonb not null,
  raw_subtotal numeric not null default 0,
  bogo_discount numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'pending', -- 'pending' | 'paid'
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Petit stockage clé/valeur générique (avis produits, popup déjà vu, etc.)
create table if not exists public.kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Index utile pour le filtre jour/semaine/mois de l'admin
create index if not exists orders_paid_at_idx on public.orders (paid_at desc);

-- ------------------------------------------------------------
-- Sécurité (RLS)
-- ------------------------------------------------------------
-- Le site est public et n'a pas de vrai compte admin (juste un bouton
-- caché) : ces règles autorisent le site (clé "anon") à lire/écrire ces
-- 3 tables, comme le faisait l'ancien window.storage. Si un jour tu
-- ajoutes une vraie connexion admin, il faudra resserrer ces policies.

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.kv_store enable row level security;

create policy "public read products" on public.products
  for select using (true);
create policy "public insert products" on public.products
  for insert with check (true);

create policy "public read orders" on public.orders
  for select using (true);
create policy "public insert orders" on public.orders
  for insert with check (true);
create policy "public update orders" on public.orders
  for update using (true) with check (true);

create policy "public read kv_store" on public.kv_store
  for select using (true);
create policy "public upsert kv_store" on public.kv_store
  for insert with check (true);
create policy "public update kv_store" on public.kv_store
  for update using (true) with check (true);
