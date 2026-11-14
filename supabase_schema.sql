-- Run this once in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Creates the PostgreSQL table used by BrandLens for live multi-device sync

create table if not exists public.brandlens_workspaces (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security and allow public anon read/write for hackathon demo mode
alter table public.brandlens_workspaces enable row level security;

drop policy if exists "BrandLens demo read" on public.brandlens_workspaces;
create policy "BrandLens demo read"
  on public.brandlens_workspaces for select
  using (true);

drop policy if exists "BrandLens demo upsert" on public.brandlens_workspaces;
create policy "BrandLens demo upsert"
  on public.brandlens_workspaces for insert
  with check (true);

drop policy if exists "BrandLens demo update" on public.brandlens_workspaces;
create policy "BrandLens demo update"
  on public.brandlens_workspaces for update
  using (true);
