-- Bolla: recreational bingo platform schema
-- Apply with the Supabase CLI or SQL editor after creating a project.
-- All game mutations should be performed by trusted server-side functions.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Organizador',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  status text not null default 'waiting' check (status in ('waiting','playing','paused','finished')),
  game_mode text not null default 'line' check (game_mode in ('line','column','diagonal','corners','full')),
  prize_label text not null default 'Prêmio surpresa',
  called_numbers integer[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  display_name text not null default 'Jogador',
  guest_token_hash text not null,
  created_at timestamptz not null default now(),
  unique (room_id, guest_token_hash)
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  numbers jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  number integer not null check (number between 1 and 75),
  drawn_at timestamptz not null default now(),
  unique (room_id, number)
);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  verified_at timestamptz not null default now()
);

create index if not exists rooms_event_id_idx on public.rooms(event_id);
create index if not exists players_room_id_idx on public.players(room_id);
create index if not exists cards_room_id_idx on public.cards(room_id);
create index if not exists draws_room_id_drawn_at_idx on public.draws(room_id, drawn_at);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.cards enable row level security;
alter table public.draws enable row level security;
alter table public.winners enable row level security;

-- Deliberately no permissive client write policies yet.
-- Add narrowly scoped policies only alongside the server-side game functions.
