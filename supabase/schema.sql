-- Esquema REAL de FotoHabit en Supabase (alineado con la app).
-- profiles / habits / posts · bucket público: posts

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

-- Storage bucket público "posts" (Dashboard → Storage si no existe)
-- insert into storage.buckets (id, name, public) values ('posts', 'posts', true);

-- Si tus FKs tienen otros nombres, posts.ts prueba también el hint :user_id / :habit_id.
