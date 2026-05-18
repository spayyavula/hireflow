-- ─── Job Recruiters (recruiter ↔ job assignments) ────────
-- Links an independent recruiter (users.role = 'recruiter') to a specific
-- job posting. See docs/adr/0001-recruiter-as-per-job-assigned-agency.md.
create table if not exists public.job_recruiters (
  job_id        text not null references public.jobs(id) on delete cascade,
  recruiter_id  text not null references public.users(id) on delete cascade,
  assigned_at   timestamptz default now(),
  primary key (job_id, recruiter_id)
);

create index if not exists idx_jr_recruiter on public.job_recruiters (recruiter_id);

alter table public.job_recruiters enable row level security;
create policy "Service role full access" on public.job_recruiters
  for all using (true) with check (true);
