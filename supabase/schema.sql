-- Esquema REAL de FotoHabit en Supabase (alineado con la app).
-- profiles / habits / posts · bucket público: posts
-- Perfil nuevo = limpio (level 1). Los habits se crean al validar/publicar (streak_days 0).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  level int default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text,
  streak_days int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id uuid references public.habits (id) on delete set null,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Una validación exitosa por usuario + día + objetivo (category).
create table if not exists public.daily_validations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  validation_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, validation_date, category)
);

create index if not exists daily_validations_user_date_idx
  on public.daily_validations (user_id, validation_date desc);

-- Si ya existía unique (user_id, validation_date), migrar:
-- alter table public.daily_validations drop constraint if exists daily_validations_user_id_validation_date_key;
-- alter table public.daily_validations alter column category set not null;
-- alter table public.daily_validations add constraint daily_validations_user_date_category_key unique (user_id, validation_date, category);

-- Storage buckets públicos (Dashboard → Storage si no existen)
-- insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- Políticas sugeridas Storage (SQL):
--   create policy "posts public read" on storage.objects for select using (bucket_id = 'posts');
--   create policy "posts auth upload" on storage.objects for insert to authenticated
--     with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Conexiones mutuas (Mi Red): solicitud → aceptar/rechazar.
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists connections_requester_idx on public.connections (requester_id, status);
create index if not exists connections_addressee_idx on public.connections (addressee_id, status);

alter table public.connections enable row level security;

drop policy if exists "connections_select_own" on public.connections;
create policy "connections_select_own"
  on public.connections for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "connections_insert_requester" on public.connections;
create policy "connections_insert_requester"
  on public.connections for insert to authenticated
  with check (auth.uid() = requester_id and requester_id <> addressee_id);

drop policy if exists "connections_update_participant" on public.connections;
create policy "connections_update_participant"
  on public.connections for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "connections_delete_participant" on public.connections;
create policy "connections_delete_participant"
  on public.connections for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Si tus FKs tienen otros nombres, posts.ts prueba también el hint :user_id / :habit_id.
