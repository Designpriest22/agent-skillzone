-- Product analytics: anonymous, first-party gameplay events. No IP address, no device fingerprint,
-- no precise location. `area` is the player's self-selected home area (or null for guests).
create table analytics_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  anon_id text not null check (char_length(anon_id) between 8 and 64),
  user_id uuid references users(id) on delete set null,
  session_id text not null check (char_length(session_id) between 8 and 64),
  name text not null,
  platform text not null check (platform in ('desktop', 'mobile', 'tablet')),
  area text,
  props jsonb not null default '{}'::jsonb
);
create index analytics_events_at on analytics_events (at);
create index analytics_events_name_at on analytics_events (name, at);
create index analytics_events_anon on analytics_events (anon_id, at);

-- Players are never given read access; only server-side admin queries touch this table.
alter table analytics_events enable row level security;
