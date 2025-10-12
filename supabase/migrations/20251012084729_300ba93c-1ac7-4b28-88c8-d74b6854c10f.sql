-- 1) Helper function to avoid recursive RLS by encapsulating lookup under SECURITY DEFINER
create or replace function public.is_referral_of(viewer_id uuid, candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.profiles v on v.id = viewer_id
    where p.id = candidate_id
      and p.referred_by = v.referral_code
  );
$$;

-- 2) Replace the recursive policy with a function-based one
drop policy if exists "Users can view their referrals" on public.profiles;
create policy "Users can view their referrals"
on public.profiles
for select
using ( public.is_referral_of(auth.uid(), id) );

-- Keep existing self-view and update policies as-is

-- 3) Ensure profiles are created automatically on signup
-- Create trigger on auth.users to call handle_new_user (function already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Ensure referral_code is generated automatically on profile insert
-- Create BEFORE INSERT trigger to call handle_referral_code (function already exists)
drop trigger if exists profiles_handle_referral_code on public.profiles;
create trigger profiles_handle_referral_code
  before insert on public.profiles
  for each row execute procedure public.handle_referral_code();

-- 5) Maintain updated_at automatically
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- 6) Backfill: create missing profiles for existing auth users
insert into public.profiles (id, email, full_name, referred_by)
select u.id, u.email, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'referral_code'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 7) Backfill: generate referral codes for profiles without one
update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;