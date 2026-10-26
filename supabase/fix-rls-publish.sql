-- FotoHabit · arreglo RLS para publicar en el feed
-- Ejecutar completo en Supabase → SQL Editor (una vez).
-- Corrige: "new row violates row-level security policy" en posts / habits / profiles / storage.

-- ── Columna de visibilidad (Feed Global | Mi Red) ───────────────────────────
alter table public.posts add column if not exists visibility text;
update public.posts set visibility = 'global' where visibility is null or visibility = '' or visibility = 'public';
update public.posts set visibility = 'network' where visibility = 'private';
alter table public.posts alter column visibility set default 'global';
do $$
begin
  alter table public.posts
    add constraint posts_visibility_check check (visibility in ('global', 'network'));
exception
  when duplicate_object then null;
  when check_violation then null;
end $$;

-- ── RLS: profiles ───────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "profiles_select_all"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── RLS: habits ─────────────────────────────────────────────────────────────
alter table public.habits enable row level security;

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_select_authenticated" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

create policy "habits_select_authenticated"
  on public.habits for select to authenticated
  using (true);

create policy "habits_insert_own"
  on public.habits for insert to authenticated
  with check (auth.uid() = user_id);

create policy "habits_update_own"
  on public.habits for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habits_delete_own"
  on public.habits for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: posts (INSERT exige auth.uid() = user_id) ──────────────────────────
alter table public.posts enable row level security;

drop policy if exists "posts_select_feed" on public.posts;
drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_update_own" on public.posts;
drop policy if exists "posts_delete_own" on public.posts;
drop policy if exists "Anyone can view posts" on public.posts;
drop policy if exists "Users can create posts" on public.posts;
drop policy if exists "Users can insert their own posts" on public.posts;

-- Lectura: globales para autenticados; Mi Red solo autor o conexión aceptada.
create policy "posts_select_feed"
  on public.posts for select to authenticated
  using (
    coalesce(visibility, 'global') = 'global'
    or user_id = auth.uid()
    or (
      coalesce(visibility, 'global') = 'network'
      and exists (
        select 1
        from public.connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.addressee_id = posts.user_id)
            or (c.addressee_id = auth.uid() and c.requester_id = posts.user_id)
          )
      )
    )
  );

create policy "posts_insert_own"
  on public.posts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete to authenticated
  using (auth.uid() = user_id);

-- ── RLS: daily_validations ──────────────────────────────────────────────────
alter table public.daily_validations enable row level security;

drop policy if exists "daily_validations_select_own" on public.daily_validations;
drop policy if exists "daily_validations_insert_own" on public.daily_validations;

create policy "daily_validations_select_own"
  on public.daily_validations for select to authenticated
  using (auth.uid() = user_id);

create policy "daily_validations_insert_own"
  on public.daily_validations for insert to authenticated
  with check (auth.uid() = user_id);

-- ── Storage bucket «posts» ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = true;

drop policy if exists "posts_storage_public_read" on storage.objects;
drop policy if exists "posts_storage_auth_upload" on storage.objects;
drop policy if exists "posts_storage_auth_update" on storage.objects;
drop policy if exists "posts_storage_auth_delete" on storage.objects;

create policy "posts_storage_public_read"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "posts_storage_auth_upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts_storage_auth_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "posts_storage_auth_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Reportes de contenido ───────────────────────────────────────────────────
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists content_reports_target_idx
  on public.content_reports (target_type, target_id);

alter table public.content_reports enable row level security;

drop policy if exists "content_reports_insert_own" on public.content_reports;
create policy "content_reports_insert_own"
  on public.content_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "content_reports_select_own" on public.content_reports;
create policy "content_reports_select_own"
  on public.content_reports for select to authenticated
  using (auth.uid() = reporter_id);
