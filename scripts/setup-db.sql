-- =============================================
-- Tryout Online Platform - Database Setup
-- Paste this entire file into Supabase SQL Editor
-- =============================================

-- 1. Sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code char(6) not null unique,
  status text not null default 'draft' check (status in ('draft','scheduled','open','closed')),
  open_mode text not null default 'manual' check (open_mode in ('manual','scheduled')),
  scheduled_open_at timestamptz,
  scheduled_close_at timestamptz,
  duration_minutes integer not null,
  created_at timestamptz default now()
);

-- 2. Questions
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  order_index integer not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text,
  correct_option char(1) not null check (correct_option in ('A','B','C','D','E')),
  created_at timestamptz default now()
);

-- 3. Students
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  wa_number text not null unique,
  name text not null,
  created_at timestamptz default now()
);

-- 4. Registrations
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students on delete cascade,
  session_id uuid references sessions on delete cascade,
  password_hash text,
  plain_password text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  unique(student_id, session_id)
);

-- 5. Attempts
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations on delete cascade unique,
  started_at timestamptz,
  submitted_at timestamptz,
  score integer,
  total_questions integer
);

-- 6. Answers
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attempts on delete cascade,
  question_id uuid references questions on delete cascade,
  chosen_option char(1) check (chosen_option in ('A','B','C','D','E')),
  is_correct boolean,
  unique(attempt_id, question_id)
);

-- 7. Login attempts (rate limiting)
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  wa_number text not null,
  session_code char(6) not null,
  attempt_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz default now(),
  unique(wa_number, session_code)
);

-- Disable RLS on all tables (access via service role only)
alter table sessions disable row level security;
alter table questions disable row level security;
alter table students disable row level security;
alter table registrations disable row level security;
alter table attempts disable row level security;
alter table answers disable row level security;
alter table login_attempts disable row level security;

-- Indexes for performance
create index if not exists idx_questions_session_id on questions(session_id, order_index);
create index if not exists idx_registrations_session_id on registrations(session_id);
create index if not exists idx_registrations_student_id on registrations(student_id);
create index if not exists idx_attempts_registration_id on attempts(registration_id);
create index if not exists idx_answers_attempt_id on answers(attempt_id);
create index if not exists idx_login_attempts_wa_session on login_attempts(wa_number, session_code);
