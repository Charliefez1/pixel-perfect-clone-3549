-- Sprint 3: New tables for project notes, portal messages, entity links, and form-delivery linking

-- 1. Project Notes
create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  body text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_notes enable row level security;

create policy "Users can manage project notes"
  on public.project_notes for all
  using (true)
  with check (true);

-- 2. Portal Messages
create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  sender_type text not null default 'team' check (sender_type in ('team', 'client')),
  sender_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.portal_messages enable row level security;

create policy "Portal messages are accessible"
  on public.portal_messages for all
  using (true)
  with check (true);

-- 3. Entity Links (generic many-to-many linking)
create table if not exists public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relationship text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(source_type, source_id, target_type, target_id)
);

alter table public.entity_links enable row level security;

create policy "Users can manage entity links"
  on public.entity_links for all
  using (true)
  with check (true);

-- 4. Add form_id to deliveries for linking feedback forms
alter table public.deliveries add column if not exists form_id uuid references public.forms(id) on delete set null;

-- 5. Add facilitator_id to deliveries
alter table public.deliveries add column if not exists facilitator_id uuid references public.contacts(id) on delete set null;

-- 6. Add default_template boolean to forms for pre-loaded templates
alter table public.forms add column if not exists is_template boolean default false;
alter table public.forms add column if not exists template_category text;
