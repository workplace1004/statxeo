-- White Labeler Social Media Engine Migration
-- Date: 2026-05-08

-- Table for storing connected social media accounts (profiles) from Outstand
create table if not exists public.statxeo_white_labeler_social_accounts (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  outstand_account_id text not null,
  provider text not null, -- e.g., 'facebook', 'instagram', 'twitter'
  display_name text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (white_labeler_id, outstand_account_id)
);

-- Table for storing social media posts and their status
create table if not exists public.statxeo_white_labeler_social_posts (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  outstand_post_id text, -- ID returned by Outstand after creation
  content text not null,
  media_urls text[] not null default '{}'::text[],
  platforms text[] not null default '{}'::text[], -- e.g., ['facebook', 'instagram']
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'published', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indices for performance
create index if not exists idx_statxeo_wl_social_accounts_wl_id on public.statxeo_white_labeler_social_accounts(white_labeler_id);
create index if not exists idx_statxeo_wl_social_posts_wl_id on public.statxeo_white_labeler_social_posts(white_labeler_id);
create index if not exists idx_statxeo_wl_social_posts_status on public.statxeo_white_labeler_social_posts(status, scheduled_at);

-- Enable RLS
alter table public.statxeo_white_labeler_social_accounts enable row level security;
alter table public.statxeo_white_labeler_social_posts enable row level security;

-- Policies for Social Accounts
create policy statxeo_white_labeler_social_accounts_authenticated_select_member
  on public.statxeo_white_labeler_social_accounts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.statxeo_white_labeler_members as members
      where members.white_labeler_id = statxeo_white_labeler_social_accounts.white_labeler_id
        and members.user_id = auth.uid()
        and members.is_active = true
    )
  );

-- Policies for Social Posts
create policy statxeo_white_labeler_social_posts_authenticated_select_member
  on public.statxeo_white_labeler_social_posts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.statxeo_white_labeler_members as members
      where members.white_labeler_id = statxeo_white_labeler_social_posts.white_labeler_id
        and members.user_id = auth.uid()
        and members.is_active = true
    )
  );

-- Trigger for updated_at
create trigger trg_statxeo_white_labeler_social_accounts_set_updated_at
  before update on public.statxeo_white_labeler_social_accounts
  for each row
  execute function public.set_statxeo_white_labeler_updated_at();

create trigger trg_statxeo_white_labeler_social_posts_set_updated_at
  before update on public.statxeo_white_labeler_social_posts
  for each row
  execute function public.set_statxeo_white_labeler_updated_at();
