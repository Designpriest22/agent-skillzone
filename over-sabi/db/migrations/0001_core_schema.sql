-- Over Sabi core schema.
-- Conventions: uuid primary keys, timestamptz everywhere, text + CHECK instead of
-- enum types (easier to evolve), ON DELETE CASCADE for user-owned learning data so
-- account deletion is complete, ON DELETE SET NULL where content must survive the
-- contributor (contributions, reviews, audit events).

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text,
  email_verified_at timestamptz,
  role text not null default 'learner'
    check (role in ('learner', 'contributor', 'reviewer', 'editor', 'admin')),
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  timezone text not null default 'Africa/Lagos',
  explanation_language text not null default 'en',
  daily_goal_minutes int not null default 10 check (daily_goal_minutes in (5, 10, 15, 20, 30)),
  learning_reasons text[] not null default '{}',
  age_band text not null default 'adult' check (age_band in ('teen', 'adult')),
  onboarding_completed_at timestamptz,
  analytics_opt_out boolean not null default false,
  leaderboard_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,
  notification_prefs jsonb not null default '{"review_reminders": true, "streak_reminders": true, "weekly_summary": true, "email": false}',
  privacy_consent_at timestamptz,
  voice_processing_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table oauth_accounts (
  provider text not null,
  provider_account_id text not null,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_account_id)
);
create index oauth_accounts_user_idx on oauth_accounts(user_id);

create table auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index auth_sessions_user_idx on auth_sessions(user_id);

create table auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('verify_email', 'reset_password')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index auth_tokens_user_idx on auth_tokens(user_id, kind);

-- ---------------------------------------------------------------------------
-- Language registry
-- ---------------------------------------------------------------------------
create table languages (
  code text primary key check (code ~ '^[a-z]{1,8}(-[a-z0-9]{2,12})*$'),
  name text not null,
  native_name text not null,
  iso_639_1 text,
  iso_639_3 text,
  family text not null,
  countries text[] not null default '{}',
  region_group text not null check (region_group in ('nigeria', 'west', 'east_central', 'southern', 'north', 'sign')),
  writing_systems text[] not null default '{Latin}',
  modality text not null default 'spoken' check (modality in ('spoken', 'signed')),
  orthography_notes text not null default '',
  dialect_notes text not null default '',
  register_notes text not null default '',
  -- catalogue_status: is it listed / can a learner start a course?
  catalogue_status text not null default 'roadmap'
    check (catalogue_status in ('roadmap', 'in_development', 'beta', 'available')),
  content_status text not null default 'none'
    check (content_status in ('none', 'draft', 'in_review', 'verified')),
  stt_status text not null default 'untested'
    check (stt_status in ('unsupported', 'untested', 'experimental', 'validated')),
  tts_status text not null default 'untested'
    check (tts_status in ('unsupported', 'untested', 'experimental', 'validated')),
  tutor_status text not null default 'unavailable'
    check (tutor_status in ('unavailable', 'experimental', 'validated')),
  speech_notes text not null default '',
  supported_levels text[] not null default '{}',
  human_reviewer_status text not null default 'none'
    check (human_reviewer_status in ('none', 'recruiting', 'active')),
  limitations text not null default '',
  is_explanation_language boolean not null default false,
  sort_order int not null default 1000,
  updated_at timestamptz not null default now()
);

create table dialects (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages(code) on delete cascade,
  name text not null,
  region text not null default '',
  notes text not null default '',
  is_default boolean not null default false,
  unique (language_code, name)
);

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  language_code text not null references languages(code),
  source_language_code text not null references languages(code),
  dialect_id uuid references dialects(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title text not null,
  topic text not null,
  description text not null default '',
  level_label text not null default 'Starter',
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (course_id, slug)
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  slug text not null,
  kind text not null default 'lesson' check (kind in ('lesson', 'assessment')),
  title text not null,
  summary text not null default '',
  estimated_minutes int not null default 5,
  xp_reward int not null default 20,
  sort_order int not null default 0,
  is_sample boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  review_status text not null default 'editorial_draft'
    check (review_status in ('ai_draft', 'editorial_draft', 'in_review', 'verified', 'disputed', 'rejected')),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug)
);

create table audio_assets (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages(code),
  storage_path text not null,
  mime_type text not null,
  duration_ms int,
  speaker_label text not null default '',
  speaker_consent boolean not null default false,
  license text not null default '',
  source text not null default '',
  review_status text not null default 'in_review'
    check (review_status in ('in_review', 'verified', 'rejected')),
  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table vocabulary (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages(code),
  source_language_code text not null references languages(code),
  dialect_id uuid references dialects(id) on delete set null,
  kind text not null default 'word' check (kind in ('word', 'phrase', 'sentence')),
  text text not null,
  translation text not null,
  literal_meaning text not null default '',
  phonetic text not null default '',
  part_of_speech text not null default '',
  example_target text not null default '',
  example_translation text not null default '',
  register text not null default 'neutral'
    check (register in ('neutral', 'formal', 'informal', 'respectful', 'intimate')),
  context_note text not null default '',
  topic text not null default '',
  audio_asset_id uuid references audio_assets(id) on delete set null,
  source text not null default '',
  contributor_id uuid references users(id) on delete set null,
  review_status text not null default 'editorial_draft'
    check (review_status in ('ai_draft', 'editorial_draft', 'in_review', 'verified', 'disputed', 'rejected')),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  license text not null default 'CC BY-SA 4.0 (Over Sabi original editorial content)',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language_code, source_language_code, text, translation)
);
create index vocabulary_lang_idx on vocabulary(language_code, review_status);

create table lesson_vocabulary (
  lesson_id uuid not null references lessons(id) on delete cascade,
  vocab_id uuid not null references vocabulary(id) on delete cascade,
  primary key (lesson_id, vocab_id)
);
create index lesson_vocabulary_vocab_idx on lesson_vocabulary(vocab_id);

create table lesson_activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  sort_order int not null default 0,
  type text not null check (type in ('listening', 'translation', 'word_order', 'matching', 'dialogue', 'recap', 'review')),
  -- payload is shown to the learner; answer never leaves the server.
  payload jsonb not null,
  answer jsonb,
  unique (lesson_id, sort_order)
);

create table cultural_notes (
  id uuid primary key default gen_random_uuid(),
  language_code text not null references languages(code),
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  body text not null,
  region text not null default '',
  source text not null default '',
  review_status text not null default 'editorial_draft'
    check (review_status in ('ai_draft', 'editorial_draft', 'in_review', 'verified', 'disputed', 'rejected')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content workflow
-- ---------------------------------------------------------------------------
create table content_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid references users(id) on delete set null,
  language_code text not null references languages(code),
  kind text not null check (kind in ('new_vocabulary', 'correction', 'pronunciation', 'cultural_note', 'dialect_variant')),
  target_entity_type text,
  target_entity_id uuid,
  payload jsonb not null,
  audio_asset_id uuid references audio_assets(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  reviewer_id uuid references users(id) on delete set null,
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index content_contributions_status_idx on content_contributions(status, created_at);

create table content_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('vocabulary', 'lesson', 'cultural_note', 'audio_asset', 'contribution')),
  entity_id uuid not null,
  reviewer_id uuid references users(id) on delete set null,
  decision text not null check (decision in ('approve', 'reject', 'request_changes', 'dispute')),
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index content_reviews_entity_idx on content_reviews(entity_type, entity_id);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  version int not null,
  snapshot jsonb not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, version)
);

create table content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) on delete set null,
  entity_type text not null check (entity_type in ('vocabulary', 'lesson', 'activity', 'cultural_note', 'tutor_reply')),
  entity_id uuid,
  language_code text references languages(code),
  reason text not null check (reason in ('wrong_translation', 'wrong_spelling', 'tone_marks', 'dialect', 'offensive', 'other')),
  details text not null default '' check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index content_reports_status_idx on content_reports(status, created_at);

-- ---------------------------------------------------------------------------
-- Tutors
-- ---------------------------------------------------------------------------
create table tutors (
  id text primary key,
  name text not null,
  language_code text not null references languages(code),
  dialect_id uuid references dialects(id) on delete set null,
  persona text not null check (persona in ('patient', 'vibe', 'precision', 'culture', 'business', 'heritage')),
  tagline text not null,
  bio text not null,
  teaching_approach text not null,
  correction_style text not null,
  default_speed numeric(3,2) not null default 1.0 check (default_speed between 0.5 and 1.5),
  levels text[] not null default '{}',
  specialties text[] not null default '{}',
  voice jsonb not null default '{}',
  avatar_key text not null,
  status text not null default 'active' check (status in ('active', 'hidden')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Learner state
-- ---------------------------------------------------------------------------
create table learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  language_code text not null references languages(code),
  course_id uuid references courses(id) on delete set null,
  level text not null default 'beginner'
    check (level in ('beginner', 'few_words', 'understand_more', 'simple_conversations', 'fluency')),
  goals text[] not null default '{}',
  daily_goal_minutes int not null default 10 check (daily_goal_minutes in (5, 10, 15, 20, 30)),
  tutor_id text references tutors(id) on delete set null,
  tutor_settings jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, language_code)
);

create table lesson_progress (
  user_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'started' check (status in ('started', 'completed')),
  best_score int not null default 0 check (best_score between 0 and 100),
  attempts int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table activity_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  activity_id uuid not null references lesson_activities(id) on delete cascade,
  correct boolean not null,
  near_miss boolean not null default false,
  score real not null default 0 check (score between 0 and 1),
  response jsonb not null,
  created_at timestamptz not null default now()
);
create index activity_attempts_user_idx on activity_attempts(user_id, created_at desc);

-- Notebook + spaced repetition. vocab_id references verified/curated content;
-- custom_* columns hold learner-saved phrases from AI conversations, which are
-- always treated as unverified.
create table user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  vocab_id uuid references vocabulary(id) on delete cascade,
  language_code text not null references languages(code),
  custom_term text,
  custom_meaning text,
  custom_note text,
  source text not null default 'lesson' check (source in ('lesson', 'conversation', 'manual')),
  saved boolean not null default false,
  ease real not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  lapses int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (vocab_id is not null or (custom_term is not null and custom_meaning is not null))
);
create unique index user_vocabulary_unique_vocab on user_vocabulary(user_id, vocab_id) where vocab_id is not null;
create index user_vocabulary_due_idx on user_vocabulary(user_id, due_at);

create table learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  language_code text not null references languages(code),
  tutor_id text references tutors(id) on delete set null,
  mode text not null check (mode in ('voice', 'text', 'guided_dialogue')),
  settings jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'ended', 'failed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int not null default 0,
  turn_count int not null default 0,
  summary jsonb,
  provider_info jsonb not null default '{}',
  transcript_expires_at timestamptz
);
create index learning_sessions_user_idx on learning_sessions(user_id, started_at desc);

create table conversation_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references learning_sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  seq int not null,
  role text not null check (role in ('learner', 'tutor')),
  text text not null,
  translation text,
  input_mode text not null default 'text' check (input_mode in ('voice', 'text')),
  stt_provider text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (session_id, seq)
);

create view session_transcripts as
  select t.session_id, t.user_id, t.seq, t.role, t.text, t.translation, t.input_mode, t.created_at
  from conversation_turns t;

create table feedback_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references learning_sessions(id) on delete cascade,
  turn_id uuid references conversation_turns(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('grammar', 'vocabulary', 'spelling', 'tone_marks', 'register', 'pronunciation', 'fluency')),
  original text not null,
  corrected text not null,
  explanation text not null,
  created_at timestamptz not null default now()
);
create index feedback_items_user_idx on feedback_items(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Engagement
-- ---------------------------------------------------------------------------
create table xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount int not null check (amount between 0 and 500),
  reason text not null,
  ref text,
  local_date date not null,
  created_at timestamptz not null default now()
);
create index xp_events_user_idx on xp_events(user_id, local_date);

create table streaks (
  user_id uuid primary key references users(id) on delete cascade,
  current_days int not null default 0,
  longest_days int not null default 0,
  last_active_date date
);

create table achievements (
  code text primary key,
  name text not null,
  description text not null,
  icon text not null,
  sort_order int not null default 0
);

create table user_achievements (
  user_id uuid not null references users(id) on delete cascade,
  code text not null references achievements(code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notifications_user_idx on notifications(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Plans, subscriptions, usage
-- ---------------------------------------------------------------------------
create table plans (
  code text primary key,
  name text not null,
  description text not null default '',
  features text[] not null default '{}',
  limits jsonb not null,
  is_public boolean not null default true,
  is_available boolean not null default true,
  sort_order int not null default 0
);

create table plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references plans(code) on delete cascade,
  provider text not null check (provider in ('paystack')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  amount_minor bigint not null check (amount_minor > 0),
  billing_interval text not null check (billing_interval in ('monthly', 'annually')),
  provider_plan_code text not null,
  active boolean not null default true,
  unique (provider, provider_plan_code)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_code text not null references plans(code),
  provider text not null check (provider in ('paystack', 'manual')),
  provider_customer_code text,
  provider_subscription_code text,
  provider_meta jsonb not null default '{}',
  status text not null check (status in ('pending', 'active', 'non_renewing', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on subscriptions(user_id, status);
create unique index subscriptions_provider_code_idx on subscriptions(provider, provider_subscription_code)
  where provider_subscription_code is not null;

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_key text not null,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);

create table usage_counters (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  ai_turns int not null default 0,
  stt_seconds int not null default 0,
  tts_chars int not null default 0,
  sessions int not null default 0,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
create table analytics_events (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  anonymous_id text,
  name text not null,
  language_code text,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index analytics_events_name_idx on analytics_events(name, created_at);

create table audit_events (
  id bigserial primary key,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_events_created_idx on audit_events(created_at desc);

create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text not null default '',
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table provider_events (
  id bigserial primary key,
  provider text not null,
  capability text not null check (capability in ('chat', 'stt', 'tts', 'email', 'payments', 'storage')),
  language_code text,
  ok boolean not null,
  latency_ms int,
  error text,
  cost_estimate_usd numeric(10,6),
  created_at timestamptz not null default now()
);
create index provider_events_created_idx on provider_events(provider, capability, created_at desc);

create table support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email citext not null,
  subject text not null check (char_length(subject) <= 200),
  message text not null check (char_length(message) <= 5000),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create table rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
