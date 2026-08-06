-- Execute no SQL Editor de um projeto Supabase novo.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9._-]{3,24}$'),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 1000 and avatar_url ~ '^https?://')),
  bio text check (bio is null or char_length(bio) <= 160),
  is_public boolean not null default true,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_unique on public.profiles (lower(username));
create table if not exists public.user_preferences (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade, theme_name text not null default 'original', primary_color text not null default '#8b5cf6', secondary_color text not null default '#4776ff', accent_color text not null default '#38d9f5', background_color text not null default '#050611', card_color text not null default '#0d1021', text_color text not null default '#f5f6ff', button_color text not null default '#7055ed', glow_color text not null default '#38d9f5', glow_strength numeric not null default .42 check(glow_strength between 0 and 1), card_opacity numeric not null default .92 check(card_opacity between .5 and 1), animation_strength numeric not null default 1 check(animation_strength between 0 and 1), wallpaper_id text not null default 'cosmic-gradient', reduced_motion boolean not null default false, updated_at timestamptz not null default now());
create table if not exists public.game_feedback (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, game_id text not null check(char_length(game_id)<=100), rating smallint not null check(rating between 1 and 5), category text not null check(category in ('Jogabilidade','Visual','Desempenho','Controles','Conteúdo','Sugestão','Outro')), title text not null check(char_length(title) between 1 and 150), message text not null check(char_length(message) between 10 and 2000), recommends boolean not null default false, publish_name boolean not null default false, game_version text check(char_length(game_version)<=100), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
do $$ begin create type public.bug_severity as enum ('Baixa','Média','Alta','Crítica'); exception when duplicate_object then null; end $$;
do $$ begin create type public.bug_status as enum ('Recebido','Em análise','Confirmado','Corrigido','Encerrado'); exception when duplicate_object then null; end $$;
create table if not exists public.bug_reports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, game_id text not null, title text not null check(char_length(title) between 1 and 150), description text not null check(char_length(description) between 10 and 5000), reproduction_steps text not null check(char_length(reproduction_steps)<=5000), expected_result text not null check(char_length(expected_result)<=3000), actual_result text not null check(char_length(actual_result)<=3000), severity public.bug_severity not null, browser_info text check(char_length(browser_info)<=500), device_info text check(char_length(device_info)<=500), screen_size text check(char_length(screen_size)<=50), game_version text check(char_length(game_version)<=100), current_url text check(char_length(current_url)<=1000), allow_contact boolean not null default false, status public.bug_status not null default 'Recebido', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table profiles enable row level security; alter table user_preferences enable row level security; alter table game_feedback enable row level security; alter table bug_reports enable row level security;
create policy "profiles_select_own" on profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_insert_own" on profiles for insert to authenticated with check ((select auth.uid()) = id);

-- A view exposes only fields intended for public display; private profiles remain hidden.
create or replace view public.public_profiles with (security_barrier = true) as
select id, display_name, username, avatar_url, bio, created_at
from public.profiles where is_public = true and onboarding_completed = true;
grant select on public.public_profiles to anon, authenticated;

-- SECURITY DEFINER avoids exposing the profiles table while returning only a boolean.
create or replace function public.is_username_available(candidate text)
returns boolean language sql stable security definer set search_path = '' as $$
  select candidate ~ '^[a-z0-9._-]{3,24}$'
    and not exists (select 1 from public.profiles where lower(username) = lower(candidate));
$$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to authenticated;
create policy "preferences_select_own" on user_preferences for select to authenticated using ((select auth.uid())=user_id); create policy "preferences_insert_own" on user_preferences for insert to authenticated with check ((select auth.uid())=user_id); create policy "preferences_update_own" on user_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "feedback_select_own" on game_feedback for select to authenticated using ((select auth.uid())=user_id); create policy "feedback_insert_own" on game_feedback for insert to authenticated with check ((select auth.uid())=user_id); create policy "feedback_update_own" on game_feedback for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id); create policy "feedback_delete_own" on game_feedback for delete to authenticated using ((select auth.uid())=user_id);
create policy "reports_select_own" on bug_reports for select to authenticated using ((select auth.uid())=user_id); create policy "reports_insert_own" on bug_reports for insert to authenticated with check ((select auth.uid())=user_id and status='Recebido');
create or replace function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create or replace function public.protect_bug_status() returns trigger language plpgsql security invoker set search_path='' as $$ begin if new.status is distinct from old.status then raise exception 'Status só pode ser alterado pela equipe administrativa'; end if; new.updated_at=now(); return new; end $$;
create policy "reports_update_own_without_status" on bug_reports for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create trigger protect_bug_status_before_update before update on bug_reports for each row execute function public.protect_bug_status();
create trigger profiles_touch before update on profiles for each row execute function public.touch_updated_at(); create trigger preferences_touch before update on user_preferences for each row execute function public.touch_updated_at(); create trigger feedback_touch before update on game_feedback for each row execute function public.touch_updated_at();
grant usage on schema public to authenticated; grant select,insert,update,delete on profiles,user_preferences,game_feedback to authenticated; grant select,insert,update on bug_reports to authenticated;
revoke all on profiles,user_preferences,game_feedback,bug_reports from anon;
