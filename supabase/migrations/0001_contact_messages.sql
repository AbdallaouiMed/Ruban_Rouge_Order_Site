-- Contact form messages. Written only by the server with the service-role key.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 30),
  message text not null check (char_length(message) between 10 and 2000),
  locale text not null default 'fr' check (locale in ('fr', 'ar', 'en')),
  ip text,
  handled boolean not null default false,
  check (email is not null or phone is not null)
);

-- RLS on with NO policies: anon and authenticated roles can neither read nor write.
-- The service-role key used by the server bypasses RLS.
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
