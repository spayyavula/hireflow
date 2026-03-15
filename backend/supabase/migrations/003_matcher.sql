-- ─── Matcher Analyses ────────────────────────────────────
-- Stores resume/cover letter vs job description analysis results
create table if not exists public.matcher_analyses (
  id              text primary key,
  seeker_id       text not null references public.users(id),
  mode            text not null check (mode in ('analyze', 'generate', 'improve')),
  jd_source       text not null check (jd_source in ('internal', 'external')),
  job_id          text references public.jobs(id),
  jd_text         text,
  resume_snapshot text,
  result          jsonb not null default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index if not exists idx_matcher_seeker
  on public.matcher_analyses (seeker_id, created_at desc);

alter table public.matcher_analyses enable row level security;
create policy "Service role full access" on public.matcher_analyses
  for all using (true) with check (true);
