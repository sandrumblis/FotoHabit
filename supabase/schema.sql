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

-- Una sola validación exitosa por usuario y día local (YYYY-MM-DD).
create table if not exists public.daily_validations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text,
  validation_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, validation_date)
);

create index if not exists daily_validations_user_date_idx
  on public.daily_validations (user_id, validation_date desc);

-- Storage buckets públicos (Dashboard → Storage si no existen)
-- insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- Políticas sugeridas Storage (SQL):
--   create policy "posts public read" on storage.objects for select using (bucket_id = 'posts');
--   create policy "posts auth upload" on storage.objects for insert to authenticated
--     with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Si tus FKs tienen otros nombres, posts.ts prueba también el hint :user_id / :habit_id.
