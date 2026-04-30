alter table public.statxeo_white_labelers
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_status text not null default 'not_started' check (stripe_connect_status in ('not_started', 'pending', 'restricted', 'active')),
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false,
  add column if not exists stripe_connect_details_submitted boolean not null default false,
  add column if not exists stripe_connect_country text,
  add column if not exists stripe_connect_email text,
  add column if not exists stripe_connect_requirements jsonb not null default '{}'::jsonb,
  add column if not exists stripe_connect_onboarded_at timestamptz,
  add column if not exists stripe_connect_last_event_id text,
  add column if not exists stripe_connect_last_error text,
  add column if not exists stripe_connect_last_synced_at timestamptz;

create unique index if not exists idx_statxeo_white_labelers_stripe_connect_account_id_unique
  on public.statxeo_white_labelers (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

create index if not exists idx_statxeo_white_labelers_stripe_connect_status
  on public.statxeo_white_labelers (stripe_connect_status, updated_at desc);

update public.statxeo_white_labelers
set
  stripe_connect_status = case
    when stripe_connected_at is not null then 'active'
    else coalesce(stripe_connect_status, 'not_started')
  end,
  stripe_connect_onboarded_at = coalesce(stripe_connect_onboarded_at, stripe_connected_at),
  stripe_connect_last_synced_at = coalesce(stripe_connect_last_synced_at, stripe_connected_at)
where stripe_connected_at is not null;