-- Urban Life Co. — initial Supabase schema
-- Apply only to the new migration project. This does not modify AppDeploy.
-- Server-side Vercel functions should use SUPABASE_SERVICE_ROLE_KEY for privileged
-- operations. Never expose that key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  date date not null,
  time text,
  location text not null,
  category text,
  experience text,
  status text not null default 'draft' check (status in ('draft','published','completed','upcoming','cancelled','postponed','archived')),
  manual_status text,
  price text,
  description text not null,
  image text,
  image_path text,
  registration_link text,
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.experiences (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null,
  category text,
  cover_image text,
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  social_link text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.stories (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text,
  date date,
  excerpt text not null,
  content text,
  cover_image text,
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  start_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb,
  constraint announcements_valid_window check (expires_at is null or start_at is null or expires_at >= start_at)
);

create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null,
  phone text,
  type text not null default 'General enquiry' check (type in ('General enquiry','Partnership','Event','Community')),
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.site_settings (
  id text primary key default gen_random_uuid()::text,
  key text not null unique default 'global',
  hero_eyebrow text,
  hero_title text,
  hero_copy text,
  community_headline text,
  community_copy text,
  updated_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.media (
  id text primary key default gen_random_uuid()::text,
  path text not null unique,
  caption text,
  event_id text,
  experience text,
  google_media_id text,
  created_at timestamptz not null default now(),
  extra jsonb not null default '{}'::jsonb
);

create table if not exists public.google_photos_picker_sessions (
  id text primary key default gen_random_uuid()::text,
  session_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text,
  experience text,
  created_at timestamptz not null default now(),
  expire_time timestamptz
);

create index if not exists events_public_date_idx on public.events (date);
create index if not exists events_status_idx on public.events (status);
create index if not exists experiences_status_idx on public.experiences (status);
create index if not exists stories_status_date_idx on public.stories (status, date desc);
create index if not exists announcements_status_window_idx on public.announcements (status, start_at, expires_at);
create index if not exists messages_email_created_idx on public.messages (lower(email), created_at desc);
create index if not exists messages_status_created_idx on public.messages (status, created_at desc);
create index if not exists media_created_idx on public.media (created_at desc);

-- Default-deny browser access. Vercel server routes will use a server-only service
-- role key after authenticating and authorizing every admin request.
alter table public.events enable row level security;
alter table public.experiences enable row level security;
alter table public.stories enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.media enable row level security;
alter table public.google_photos_picker_sessions enable row level security;

-- Public media can be read by website visitors; all writes remain server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 6291456, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view Urban Life media" on storage.objects;
create policy "Public can view Urban Life media"
on storage.objects for select
to public
using (bucket_id = 'site-media');

-- No browser insert/update/delete policies are intentionally created.
