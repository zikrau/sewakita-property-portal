-- SewaKita production-ready Supabase schema.
-- Jalankan seluruh file ini pada Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('user','moderator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.listing_status as enum ('draft','pending','approved','rejected','archived');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  owner_display_name text not null default 'Pemilik SYUZISHIM',
  title text not null check (char_length(title) between 5 and 120),
  property_type text not null check (property_type in ('kost','rumah','kontrakan','apartemen','ruko','villa','lainnya')),
  city text not null check (char_length(city) between 2 and 80),
  area text not null check (char_length(area) between 2 and 100),
  address text,
  price bigint not null check (price >= 0),
  period text not null check (period in ('harian','mingguan','bulanan','tahunan')),
  bedrooms int not null default 1 check (bedrooms >= 0 and bedrooms <= 100),
  bathrooms int not null default 1 check (bathrooms >= 0 and bathrooms <= 100),
  area_m2 numeric(10,2) check (area_m2 is null or (area_m2 > 0 and area_m2 <= 100000)),
  furnished boolean not null default false,
  description text not null default '' check (char_length(description) <= 10000),
  facilities text[] not null default '{}',
  image_urls text[] not null default '{}',
  whatsapp text,
  is_verified boolean not null default false,
  featured boolean not null default false,
  status public.listing_status not null default 'draft',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.listing_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  category text not null default 'lainnya',
  note text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_owner_idx on public.listings(owner_id);
create index if not exists listings_city_area_idx on public.listings(city, area);
create index if not exists listings_featured_idx on public.listings(featured, published_at desc);
create index if not exists reports_listing_idx on public.listing_reports(listing_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_reports enable row level security;
alter table public.audit_logs enable row level security;

-- Browser roles get only the minimum table/column privileges needed.
revoke all on public.profiles from anon, authenticated;
revoke all on public.listings from anon, authenticated;
revoke all on public.listing_reports from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select on public.listings to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, full_name, phone) on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant insert (owner_id, owner_display_name, title, property_type, city, area, address, price, period, bedrooms, bathrooms, area_m2, furnished, description, facilities, image_urls, whatsapp, status) on public.listings to authenticated;
grant update (title, property_type, city, area, address, price, period, bedrooms, bathrooms, area_m2, furnished, description, facilities, image_urls, whatsapp, status) on public.listings to authenticated;

grant insert (reporter_id, listing_id, category, note) on public.listing_reports to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.listing_reports to authenticated;

-- Profiles: users can read/update themselves. Role cannot be edited from the browser.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'user');

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Public: only approved listings are visible. Authenticated owners also see their own workflow rows.
drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings
for select to anon, authenticated
using (
  status = 'approved'
  or owner_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
);

-- Any normal user may create only for themselves, never verified or featured.
drop policy if exists listings_owner_insert on public.listings;
create policy listings_owner_insert on public.listings
for insert to authenticated
with check (
  owner_id = auth.uid()
  and status in ('draft','pending')
  and is_verified = false
  and featured = false
);

-- A normal owner may edit their own content. Any edit to an approved listing must transition it back to draft/pending/rejected,
-- which removes it from public view until moderation. Protected columns are not granted to the browser role.
drop policy if exists listings_owner_update on public.listings;
create policy listings_owner_update on public.listings
for update to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and status in ('draft','pending','rejected')
  and is_verified = false
  and featured = false
);

-- Staff can read all rows through the select policy above; actual protected updates are performed by server actions with service role.
-- There is intentionally no DELETE policy/grant for browser roles. Use archive instead of destructive delete.

drop policy if exists report_insert on public.listing_reports;
create policy report_insert on public.listing_reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists report_self_select on public.listing_reports;
create policy report_self_select on public.listing_reports
for select to authenticated
using (reporter_id = auth.uid());

-- Audit logs are read-only from the browser; writes happen through trusted server code.
drop policy if exists audit_select_staff on public.audit_logs;
create policy audit_select_staff on public.audit_logs
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings for each row execute function public.set_updated_at();

-- Public image bucket. Reads are public; upload/update/delete are restricted to a user's own folder.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'listing-images';

drop policy if exists listing_images_insert on storage.objects;
create policy listing_images_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists listing_images_update on storage.objects;
create policy listing_images_update on storage.objects
for update to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists listing_images_delete on storage.objects;
create policy listing_images_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- Owner display name is taken from the authenticated user's profile, not trusted from the browser.
create or replace function public.sync_listing_owner_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.owner_id = auth.uid() then
    select coalesce(full_name, 'Pemilik SewaKita') into new.owner_display_name
    from public.profiles where id = new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_owner_name on public.listings;
create trigger listings_owner_name
before insert or update on public.listings
for each row execute function public.sync_listing_owner_name();

-- OPTIONAL ADMIN BOOTSTRAP (run after registering the admin account):
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'ADMIN_EMAIL_HERE');
--
-- Do NOT put SUPABASE_SERVICE_ROLE_KEY in browser/client code, GitHub, or public files.
