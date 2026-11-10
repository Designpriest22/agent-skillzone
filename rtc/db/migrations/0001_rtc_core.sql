-- Run The Capital core schema: accounts, profiles, verified runs, ledgers, store, social.
create extension if not exists citext;
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  password_hash text not null,
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

create table auth_sessions (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  username citext unique not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  avatar text not null default 'odumodu',
  home_area text not null,
  selected_fighter text not null default 'odumodu',
  equipment text,
  xp bigint not null default 0 check (xp >= 0),
  cash bigint not null default 0 check (cash >= 0),
  wins int not null default 0,
  losses int not null default 0,
  bosses_defeated int not null default 0,
  missions_completed int not null default 0,
  highest_combo int not null default 0,
  tokens_found int not null default 0,
  total_cash_earned bigint not null default 0,
  respect int not null default 0,
  banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_xp on profiles (xp desc);
create index profiles_area_xp on profiles (home_area, xp desc);

create table fighters_owned (
  user_id uuid not null references users(id) on delete cascade,
  fighter_id text not null,
  level int not null default 1,
  xp int not null default 0,
  source text not null default 'starter' check (source in ('starter', 'rank', 'boss', 'cash', 'paystack')),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, fighter_id)
);

-- Every run gets a server seed at start; only a server re-simulation of the input log can verify it.
create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  fighter_id text not null,
  substage_id text not null,
  equipment text,
  seed bigint not null,
  status text not null default 'started' check (status in ('started', 'verified', 'rejected')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ticks int,
  score int,
  max_combo int,
  kos int,
  damage_taken int,
  tokens int,
  rating text,
  cleared boolean,
  boss_defeated boolean,
  reject_reason text
);
create index runs_board on runs (substage_id, score desc) where status = 'verified' and cleared;
create index runs_user on runs (user_id, finished_at desc);
create index runs_week on runs (finished_at) where status = 'verified';

create table substage_bests (
  user_id uuid not null references users(id) on delete cascade,
  substage_id text not null,
  best_score int not null,
  best_rating text not null,
  best_ticks int not null,
  clears int not null default 1,
  primary key (user_id, substage_id)
);

-- Append-only ledgers. The unique key makes every reward idempotent.
create table xp_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  amount int not null,
  reason text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);
create table cash_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  amount int not null,
  reason text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);

create table achievements (
  user_id uuid not null references users(id) on delete cascade,
  achievement_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table mission_claims (
  user_id uuid not null references users(id) on delete cascade,
  mission_id text not null,
  period text not null,
  run_id uuid references runs(id),
  claimed_at timestamptz not null default now(),
  primary key (user_id, mission_id, period)
);

create table inventory (
  user_id uuid not null references users(id) on delete cascade,
  item_id text not null,
  source text not null check (source in ('earned', 'cash', 'paystack')),
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Naira purchases. A row only becomes 'paid' from a verified Paystack webhook.
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_id text not null,
  amount_kobo int not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  reference text unique not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table reactions (
  from_user uuid not null references users(id) on delete cascade,
  to_user uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('respect', 'fire', 'rematch')),
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, kind)
);

create table reports (
  id bigserial primary key,
  reporter uuid not null references users(id) on delete cascade,
  target uuid not null references users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 300),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Row-level security for player-owned private data. Reads in player context go
-- through `withUser`, which switches to this role and sets app.user_id.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'rtc_app') then create role rtc_app nologin; end if;
end $$;
grant rtc_app to current_user;
grant usage on schema public to rtc_app;
grant select on profiles, fighters_owned, runs, substage_bests, xp_ledger, cash_ledger, achievements, mission_claims, inventory, purchases to rtc_app;

create or replace function app_uid() returns uuid language sql stable as
  $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

alter table xp_ledger enable row level security;
alter table cash_ledger enable row level security;
alter table inventory enable row level security;
alter table purchases enable row level security;
alter table mission_claims enable row level security;
create policy own_xp on xp_ledger for select to rtc_app using (user_id = app_uid());
create policy own_cash on cash_ledger for select to rtc_app using (user_id = app_uid());
create policy own_inv on inventory for select to rtc_app using (user_id = app_uid());
create policy own_purchases on purchases for select to rtc_app using (user_id = app_uid());
create policy own_missions on mission_claims for select to rtc_app using (user_id = app_uid());
