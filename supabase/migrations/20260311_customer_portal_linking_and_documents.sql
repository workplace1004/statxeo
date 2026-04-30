create extension if not exists pgcrypto;

create table if not exists public.statxeo_customer_lead_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.statxeo_leads(id) on delete cascade,
  linked_by text not null default 'email_match',
  created_at timestamptz not null default now(),
  unique (user_id, lead_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'statxeo_customer_lead_links_linked_by_check'
      and conrelid = 'public.statxeo_customer_lead_links'::regclass
  ) then
    alter table public.statxeo_customer_lead_links
      add constraint statxeo_customer_lead_links_linked_by_check
      check (linked_by in ('email_match', 'manual', 'admin', 'import'));
  end if;
end
$$;

create index if not exists idx_statxeo_customer_lead_links_user_created_at
  on public.statxeo_customer_lead_links (user_id, created_at desc);

create index if not exists idx_statxeo_customer_lead_links_lead_created_at
  on public.statxeo_customer_lead_links (lead_id, created_at desc);

alter table public.statxeo_customer_lead_links enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_customer_lead_links'
      and policyname = 'customer_lead_links_authenticated_select_own'
  ) then
    create policy customer_lead_links_authenticated_select_own
      on public.statxeo_customer_lead_links
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_customer_lead_links'
      and policyname = 'customer_lead_links_service_role_all'
  ) then
    create policy customer_lead_links_service_role_all
      on public.statxeo_customer_lead_links
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

create table if not exists public.statxeo_customer_documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.statxeo_leads(id) on delete cascade,
  title text not null,
  description text,
  document_kind text not null default 'delivery_asset',
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  size_bytes bigint,
  uploaded_by_user_id uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (public_url is not null or (storage_bucket is not null and storage_path is not null))
);

create index if not exists idx_statxeo_customer_documents_lead_uploaded_at
  on public.statxeo_customer_documents (lead_id, uploaded_at desc);

create index if not exists idx_statxeo_customer_documents_kind_uploaded_at
  on public.statxeo_customer_documents (document_kind, uploaded_at desc);

create or replace function public.set_statxeo_customer_documents_updated_at()
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
    where tgname = 'trg_statxeo_customer_documents_set_updated_at'
      and tgrelid = 'public.statxeo_customer_documents'::regclass
  ) then
    create trigger trg_statxeo_customer_documents_set_updated_at
      before update on public.statxeo_customer_documents
      for each row
      execute function public.set_statxeo_customer_documents_updated_at();
  end if;
end
$$;

alter table public.statxeo_customer_documents enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_customer_documents'
      and policyname = 'customer_documents_authenticated_select_own_or_email_match'
  ) then
    create policy customer_documents_authenticated_select_own_or_email_match
      on public.statxeo_customer_documents
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.statxeo_customer_lead_links as links
          where links.lead_id = statxeo_customer_documents.lead_id
            and links.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.statxeo_leads as leads
          where leads.id = statxeo_customer_documents.lead_id
            and lower(coalesce(leads.contact_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'statxeo_customer_documents'
      and policyname = 'customer_documents_service_role_all'
  ) then
    create policy customer_documents_service_role_all
      on public.statxeo_customer_documents
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;
