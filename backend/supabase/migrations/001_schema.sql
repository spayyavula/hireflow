-- ============================================================
-- HireFlow Database Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Users ───────────────────────────────────────────────
create table if not exists public.users (
  id              text primary key,
  email           text unique not null,
  hashed_password text not null,
  role            text not null check (role in ('seeker', 'recruiter', 'company')),
  name            text,
  headline        text,
  location        text,
  company_name    text,
  industry        text,
  company_size    text,
  agency          text,
  specializations jsonb default '[]'::jsonb,
  -- Seeker profile fields
  skills          jsonb default '[]'::jsonb,
  desired_roles   jsonb default '[]'::jsonb,
  experience_level text,
  work_preferences jsonb default '[]'::jsonb,
  salary_range    text,
  industries      jsonb default '[]'::jsonb,
  experience      jsonb default '[]'::jsonb,
  education       jsonb default '[]'::jsonb,
  summary         text,
  ai_summary      text,
  profile_strength text default 'Needs Work',
  created_at      timestamptz default now()
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role on public.users (role);

-- ─── Jobs ────────────────────────────────────────────────
create table if not exists public.jobs (
  id               text primary key,
  company_id       text not null references public.users(id),
  title            text not null,
  location         text,
  salary_min       integer,
  salary_max       integer,
  type             text default 'full-time' check (type in ('full-time', 'part-time', 'contract', 'internship')),
  remote           boolean default false,
  description      text,
  required_skills  jsonb default '[]'::jsonb,
  nice_skills      jsonb default '[]'::jsonb,
  experience_level text,
  status           text default 'active' check (status in ('active', 'paused', 'closed')),
  applicant_count  integer default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_jobs_company on public.jobs (company_id);
create index if not exists idx_jobs_status on public.jobs (status);

-- ─── Applications ────────────────────────────────────────
create table if not exists public.applications (
  id            text primary key,
  job_id        text not null references public.jobs(id),
  seeker_id     text not null references public.users(id),
  status        text default 'applied' check (status in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  cover_letter  text,
  created_at    timestamptz default now(),
  unique(job_id, seeker_id)
);

create index if not exists idx_apps_job on public.applications (job_id);
create index if not exists idx_apps_seeker on public.applications (seeker_id);
create index if not exists idx_apps_status on public.applications (status);

-- ─── Conversations ───────────────────────────────────────
create table if not exists public.conversations (
  id         text primary key,
  created_at timestamptz default now()
);

-- ─── Conversation Participants (many-to-many) ────────────
create table if not exists public.conversation_participants (
  conversation_id text not null references public.conversations(id) on delete cascade,
  user_id         text not null references public.users(id),
  primary key (conversation_id, user_id)
);

create index if not exists idx_cp_user on public.conversation_participants (user_id);

-- ─── Messages ────────────────────────────────────────────
create table if not exists public.messages (
  id               text primary key,
  conversation_id  text not null references public.conversations(id) on delete cascade,
  sender_id        text not null references public.users(id),
  content          text not null,
  read             boolean default false,
  created_at       timestamptz default now()
);

create index if not exists idx_messages_conv on public.messages (conversation_id);
create index if not exists idx_messages_sender on public.messages (sender_id);

-- ─── Increment applicant_count trigger ───────────────────
create or replace function increment_applicant_count()
returns trigger as $$
begin
  update public.jobs
  set applicant_count = applicant_count + 1
  where id = NEW.job_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_increment_applicants on public.applications;
create trigger trg_increment_applicants
  after insert on public.applications
  for each row
  execute function increment_applicant_count();

-- ─── Row Level Security ──────────────────────────────────
-- Enable RLS on all tables (policies added below)
alter table public.users enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Allow the service_role key (used by our API) full access
-- These policies apply when using the service_role key from the backend
create policy "Service role full access" on public.users
  for all using (true) with check (true);
create policy "Service role full access" on public.jobs
  for all using (true) with check (true);
create policy "Service role full access" on public.applications
  for all using (true) with check (true);
create policy "Service role full access" on public.conversations
  for all using (true) with check (true);
create policy "Service role full access" on public.conversation_participants
  for all using (true) with check (true);
create policy "Service role full access" on public.messages
  for all using (true) with check (true);
