-- Create a table for public profiles that links to auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('singer', 'audience', 'venue', 'advertiser', 'admin')) not null default 'audience',
  nickname text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Singer specific details
create table public.singers (
  id uuid references public.profiles(id) not null primary key,
  stage_name text not null,
  team_id uuid,
  qr_code_pattern text, 
  social_links jsonb, 
  is_verified boolean default false,
  fan_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team management
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  leader_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.singers add constraint fk_team foreign key (team_id) references public.teams(id);

-- Audience specific details
create table public.audience (
  id uuid references public.profiles(id) not null primary key,
  level_grade text default 'basic', 
  subscription_status text,
  avatar_config jsonb, 
  notification_preferences jsonb 
);

-- Venues
create table public.venues (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  location_text text not null,
  location_lat double precision,
  location_lng double precision,
  description text,
  rental_cost_per_hour integer default 0,
  amenities jsonb, 
  contact_info text
);

-- Phase 3 NEW TABLES --

-- Songs (Repertoire)
create table public.songs (
  id uuid default gen_random_uuid() primary key,
  singer_id uuid references public.singers(id) not null,
  title text not null,
  artist text not null,
  youtube_url text,
  tags jsonb, -- { "genre": "ballad", "difficulty": "hard" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Performances (Events)
create table public.performances (
  id uuid default gen_random_uuid() primary key,
  singer_id uuid references public.singers(id) not null,
  title text not null,
  location_text text not null,
  location_lat double precision not null,
  location_lng double precision not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  description text,
  chat_enabled boolean default false,
  chat_cost_per_hour integer default 0,
  status text default 'scheduled', -- scheduled, live, ended, cancelled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Performance Setlist
create table public.performance_songs (
  id uuid default gen_random_uuid() primary key,
  performance_id uuid references public.performances(id) not null,
  song_id uuid references public.songs(id) not null,
  order_index integer not null,
  status text default 'pending', -- pending, playing, played
  is_request boolean default false
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, nickname, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'audience'), coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
