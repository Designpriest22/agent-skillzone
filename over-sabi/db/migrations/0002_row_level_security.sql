-- Row-level security.
--
-- Request handlers that act on behalf of a learner run inside a transaction that
-- does `SET LOCAL ROLE oversabi_app` and `set_config('app.user_id', <id>, true)`.
-- The oversabi_app role has no BYPASSRLS, so every user-owned table below only
-- exposes the current learner's rows, even if a query forgets its WHERE clause.
--
-- Privileged work (authentication lookups, payment webhooks, admin tools after a
-- server-side role check) runs as the connection owner and is audited separately.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'oversabi_app') then
    create role oversabi_app nologin;
  end if;
end $$;

-- The connecting role must be able to SET ROLE to oversabi_app.
do $$
begin
  execute format('grant oversabi_app to %I', current_user);
exception when others then
  raise notice 'grant oversabi_app to current_user skipped: %', sqlerrm;
end $$;

create or replace function app_uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

grant usage on schema public to oversabi_app;
grant execute on function app_uid() to oversabi_app;

-- Read-only reference content.
grant select on languages, dialects, courses, chapters, lessons, lesson_activities, lesson_vocabulary,
  vocabulary, audio_assets, cultural_notes, tutors, achievements, plans, plan_prices, feature_flags
  to oversabi_app;
-- lesson_activities.answer must never be readable through the learner role.
revoke select on lesson_activities from oversabi_app;
grant select (id, lesson_id, sort_order, type, payload) on lesson_activities to oversabi_app;

-- Learners may file reports and contributions (insert only, their own id).
grant insert on content_reports, content_contributions to oversabi_app;
alter table content_reports enable row level security;
create policy content_reports_insert on content_reports for insert to oversabi_app
  with check (reporter_id = app_uid());
alter table content_contributions enable row level security;
create policy content_contributions_own on content_contributions for select to oversabi_app
  using (contributor_id = app_uid());
grant select on content_contributions to oversabi_app;
create policy content_contributions_insert on content_contributions for insert to oversabi_app
  with check (contributor_id = app_uid() and status = 'pending');

-- Fully learner-owned tables: read/write own rows only.
do $$
declare t text;
begin
  foreach t in array array[
    'learning_plans', 'lesson_progress', 'activity_attempts', 'user_vocabulary',
    'learning_sessions', 'conversation_turns', 'feedback_items', 'xp_events', 'streaks',
    'user_achievements'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('grant select, insert, update, delete on %I to oversabi_app', t);
    execute format(
      'create policy %I on %I for all to oversabi_app using (user_id = app_uid()) with check (user_id = app_uid())',
      t || '_own', t);
  end loop;
end $$;

-- Profile: read/update own; created by the auth system.
alter table profiles enable row level security;
grant select, update on profiles to oversabi_app;
create policy profiles_own on profiles for all to oversabi_app
  using (user_id = app_uid()) with check (user_id = app_uid());

-- Users: a learner can read and rename themselves, nothing else. Role and
-- email changes go through privileged server code.
alter table users enable row level security;
grant select (id, email, email_verified_at, role, display_name, created_at) on users to oversabi_app;
grant update (display_name, updated_at) on users to oversabi_app;
create policy users_self on users for all to oversabi_app using (id = app_uid()) with check (id = app_uid());

-- Entitlements are read-only for learners. Only verified payment webhooks and
-- audited admin actions (privileged connection) can write them.
alter table subscriptions enable row level security;
grant select on subscriptions to oversabi_app;
create policy subscriptions_read_own on subscriptions for select to oversabi_app using (user_id = app_uid());

alter table usage_counters enable row level security;
grant select on usage_counters to oversabi_app;
create policy usage_read_own on usage_counters for select to oversabi_app using (user_id = app_uid());

alter table notifications enable row level security;
grant select, delete on notifications to oversabi_app;
grant update (read_at) on notifications to oversabi_app;
create policy notifications_own on notifications for all to oversabi_app
  using (user_id = app_uid()) with check (user_id = app_uid());

grant usage on all sequences in schema public to oversabi_app;
