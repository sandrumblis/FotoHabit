-- Referencia del esquema esperado por la app FotoHabit.
-- Si tus columnas difieren, alinea nombres o ajusta lib/supabase/*.

-- profiles (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  accent text default 'cyan',
  created_at timestamptz not null default now()
);

-- habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category_key text,
  accent text default 'cyan',
  streak_days int default 0,
  level int default 1,
  created_at timestamptz not null default now()
);

-- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id uuid references public.habits (id) on delete set null,
  image_url text not null,
  caption text,
  likes_count int default 0,
  created_at timestamptz not null default now()
);

-- Storage bucket público "posts" (crear en Dashboard si no existe)
-- insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
