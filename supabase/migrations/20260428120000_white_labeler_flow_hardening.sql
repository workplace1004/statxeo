-- Allow Stripe checkout ledger rows to be distinguished from manual/statxt imports.
alter table public.statxeo_white_labeler_charges
  drop constraint if exists statxeo_white_labeler_charges_source_system_check;

alter table public.statxeo_white_labeler_charges
  add constraint statxeo_white_labeler_charges_source_system_check
  check (source_system in ('statxt', 'manual', 'import', 'stripe_checkout'));

-- Partner application lifecycle: invited after password-setup email is sent.
alter table public.statxeo_white_labeler_applications
  drop constraint if exists statxeo_white_labeler_applications_status_check;

alter table public.statxeo_white_labeler_applications
  add constraint statxeo_white_labeler_applications_status_check
  check (status in ('pending_review', 'approved', 'invited', 'rejected'));
