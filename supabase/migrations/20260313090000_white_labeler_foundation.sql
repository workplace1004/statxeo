create extension if not exists pgcrypto;

create table if not exists public.statxeo_white_labelers (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'suspended', 'closed')),
  default_currency text not null default 'usd',
  default_payout_day smallint not null default 1 check (default_payout_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statxeo_white_labeler_members (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (white_labeler_id, user_id)
);

create table if not exists public.statxeo_white_labeler_clients (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  external_customer_id text,
  client_name text not null,
  billing_email text,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  active_site_count integer not null default 1 check (active_site_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statxeo_white_labeler_plan_overrides (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  plan_code text not null,
  currency text not null default 'usd',
  amount_sold_cents bigint not null check (amount_sold_cents >= 0),
  base_cost_cents bigint not null check (base_cost_cents >= 0),
  white_label_fee_cents bigint not null check (white_label_fee_cents >= 0),
  is_active boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists public.statxeo_white_labeler_charges (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  client_id uuid references public.statxeo_white_labeler_clients(id) on delete set null,
  source_event_id text not null,
  source_system text not null default 'statxt' check (source_system in ('statxt', 'manual', 'import')),
  source_charge_type text not null check (source_charge_type in ('subscription', 'invoice', 'one_time', 'adjustment')),
  charge_status text not null default 'posted' check (charge_status in ('posted', 'voided', 'refunded')),
  settlement_month date not null,
  charged_at timestamptz not null default now(),
  plan_code text not null,
  currency text not null default 'usd',
  amount_sold_cents bigint not null check (amount_sold_cents >= 0),
  base_cost_cents bigint not null check (base_cost_cents >= 0),
  white_label_fee_cents bigint not null check (white_label_fee_cents >= 0),
  net_payout_cents bigint generated always as (
    greatest(0::bigint, amount_sold_cents - (base_cost_cents + white_label_fee_cents))
  ) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (white_labeler_id, source_event_id),
  check (date_trunc('month', settlement_month::timestamp) = settlement_month::timestamp)
);

create table if not exists public.statxeo_white_labeler_payout_batches (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  settlement_month date not null,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'paid', 'voided')),
  currency text not null default 'usd',
  gross_amount_cents bigint not null default 0 check (gross_amount_cents >= 0),
  adjustment_amount_cents bigint not null default 0,
  net_amount_cents bigint not null default 0,
  generated_at timestamptz not null default now(),
  finalized_at timestamptz,
  paid_at timestamptz,
  locked_by_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (white_labeler_id, settlement_month),
  check (date_trunc('month', settlement_month::timestamp) = settlement_month::timestamp)
);

create table if not exists public.statxeo_white_labeler_payout_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.statxeo_white_labeler_payout_batches(id) on delete cascade,
  charge_id uuid not null references public.statxeo_white_labeler_charges(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  unique (batch_id, charge_id),
  unique (charge_id)
);

create table if not exists public.statxeo_white_labeler_adjustments (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  batch_id uuid references public.statxeo_white_labeler_payout_batches(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in ('credit', 'debit', 'reversal')),
  amount_cents bigint not null check (amount_cents > 0),
  reason text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.statxeo_white_labeler_branding_settings (
  white_labeler_id uuid primary key references public.statxeo_white_labelers(id) on delete cascade,
  brand_name text,
  primary_color text,
  secondary_color text,
  logo_url text,
  support_email text,
  support_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statxeo_white_labeler_domains (
  id uuid primary key default gen_random_uuid(),
  white_labeler_id uuid not null references public.statxeo_white_labelers(id) on delete cascade,
  domain text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'failed')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain)
);

create unique index if not exists idx_statxeo_wl_clients_external_customer_unique
  on public.statxeo_white_labeler_clients (white_labeler_id, external_customer_id)
  where external_customer_id is not null;

create index if not exists idx_statxeo_wl_members_user
  on public.statxeo_white_labeler_members (user_id, is_active);

create index if not exists idx_statxeo_wl_clients_status
  on public.statxeo_white_labeler_clients (white_labeler_id, status, created_at desc);

create index if not exists idx_statxeo_wl_plan_overrides_active
  on public.statxeo_white_labeler_plan_overrides (white_labeler_id, plan_code, is_active, effective_from desc);

create index if not exists idx_statxeo_wl_charges_month
  on public.statxeo_white_labeler_charges (white_labeler_id, settlement_month desc, charged_at desc);

create index if not exists idx_statxeo_wl_batches_month
  on public.statxeo_white_labeler_payout_batches (white_labeler_id, settlement_month desc, status);

create index if not exists idx_statxeo_wl_adjustments_batch
  on public.statxeo_white_labeler_adjustments (white_labeler_id, batch_id, created_at desc);

create index if not exists idx_statxeo_wl_domains_status
  on public.statxeo_white_labeler_domains (white_labeler_id, verification_status, created_at desc);

create or replace function public.set_statxeo_white_labeler_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labelers_set_updated_at'
      and tgrelid = 'public.statxeo_white_labelers'::regclass
  ) then
    create trigger trg_statxeo_white_labelers_set_updated_at
      before update on public.statxeo_white_labelers
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_clients_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_clients'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_clients_set_updated_at
      before update on public.statxeo_white_labeler_clients
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_plan_overrides_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_plan_overrides'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_plan_overrides_set_updated_at
      before update on public.statxeo_white_labeler_plan_overrides
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_payout_batches_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_payout_batches'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_payout_batches_set_updated_at
      before update on public.statxeo_white_labeler_payout_batches
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_branding_settings_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_branding_settings'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_branding_settings_set_updated_at
      before update on public.statxeo_white_labeler_branding_settings
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_statxeo_white_labeler_domains_set_updated_at'
      and tgrelid = 'public.statxeo_white_labeler_domains'::regclass
  ) then
    create trigger trg_statxeo_white_labeler_domains_set_updated_at
      before update on public.statxeo_white_labeler_domains
      for each row
      execute function public.set_statxeo_white_labeler_updated_at();
  end if;
end
$$;

alter table public.statxeo_white_labelers enable row level security;
alter table public.statxeo_white_labeler_members enable row level security;
alter table public.statxeo_white_labeler_clients enable row level security;
alter table public.statxeo_white_labeler_plan_overrides enable row level security;
alter table public.statxeo_white_labeler_charges enable row level security;
alter table public.statxeo_white_labeler_payout_batches enable row level security;
alter table public.statxeo_white_labeler_payout_items enable row level security;
alter table public.statxeo_white_labeler_adjustments enable row level security;
alter table public.statxeo_white_labeler_branding_settings enable row level security;
alter table public.statxeo_white_labeler_domains enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'statxeo_white_labelers',
    'statxeo_white_labeler_members',
    'statxeo_white_labeler_clients',
    'statxeo_white_labeler_plan_overrides',
    'statxeo_white_labeler_charges',
    'statxeo_white_labeler_payout_batches',
    'statxeo_white_labeler_payout_items',
    'statxeo_white_labeler_adjustments',
    'statxeo_white_labeler_branding_settings',
    'statxeo_white_labeler_domains'
  ] loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_service_role_all'
    ) then
      execute format(
        'create policy %I on public.%I for all to service_role using (true) with check (true)',
        table_name || '_service_role_all',
        table_name
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labelers'
      and policyname = 'statxeo_white_labelers_authenticated_select_member'
  ) then
    create policy statxeo_white_labelers_authenticated_select_member
      on public.statxeo_white_labelers
      for select
      to authenticated
      using (
        owner_user_id = auth.uid()
        or exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labelers.id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_members'
      and policyname = 'statxeo_white_labeler_members_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_members_authenticated_select_member
      on public.statxeo_white_labeler_members
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.statxeo_white_labeler_members as own_membership
          where own_membership.white_labeler_id = statxeo_white_labeler_members.white_labeler_id
            and own_membership.user_id = auth.uid()
            and own_membership.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_clients'
      and policyname = 'statxeo_white_labeler_clients_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_clients_authenticated_select_member
      on public.statxeo_white_labeler_clients
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_clients.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_plan_overrides'
      and policyname = 'statxeo_white_labeler_plan_overrides_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_plan_overrides_authenticated_select_member
      on public.statxeo_white_labeler_plan_overrides
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_plan_overrides.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_charges'
      and policyname = 'statxeo_white_labeler_charges_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_charges_authenticated_select_member
      on public.statxeo_white_labeler_charges
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_charges.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_payout_batches'
      and policyname = 'statxeo_white_labeler_payout_batches_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_payout_batches_authenticated_select_member
      on public.statxeo_white_labeler_payout_batches
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_payout_batches.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_payout_items'
      and policyname = 'statxeo_white_labeler_payout_items_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_payout_items_authenticated_select_member
      on public.statxeo_white_labeler_payout_items
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_payout_batches as batches
          join public.statxeo_white_labeler_members as members
            on members.white_labeler_id = batches.white_labeler_id
          where batches.id = statxeo_white_labeler_payout_items.batch_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_adjustments'
      and policyname = 'statxeo_white_labeler_adjustments_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_adjustments_authenticated_select_member
      on public.statxeo_white_labeler_adjustments
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_adjustments.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_branding_settings'
      and policyname = 'statxeo_white_labeler_branding_settings_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_branding_settings_authenticated_select_member
      on public.statxeo_white_labeler_branding_settings
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_branding_settings.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_white_labeler_domains'
      and policyname = 'statxeo_white_labeler_domains_authenticated_select_member'
  ) then
    create policy statxeo_white_labeler_domains_authenticated_select_member
      on public.statxeo_white_labeler_domains
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_white_labeler_members as members
          where members.white_labeler_id = statxeo_white_labeler_domains.white_labeler_id
            and members.user_id = auth.uid()
            and members.is_active = true
        )
      );
  end if;
end
$$;