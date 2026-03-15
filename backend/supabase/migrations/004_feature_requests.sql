-- ─── Feature Requests ────────────────────────────────────
create table if not exists public.feature_requests (
  id              text primary key,
  user_id         text not null references public.users(id),
  title           text not null,
  description     text not null,
  category        text not null check (category in (
    'Job Search', 'Resume Tools', 'Recruiter Tools',
    'Company Dashboard', 'Chat & Messaging', 'AI Features', 'General'
  )),
  status          text not null default 'submitted' check (status in (
    'submitted', 'under_review', 'planned', 'in_progress', 'shipped'
  )),
  vote_count      integer not null default 0,
  created_at      timestamptz default now()
);

create index if not exists idx_fr_user on public.feature_requests (user_id);
create index if not exists idx_fr_status on public.feature_requests (status);
create index if not exists idx_fr_votes on public.feature_requests (vote_count desc);
create index if not exists idx_fr_created on public.feature_requests (created_at desc);

alter table public.feature_requests enable row level security;
create policy "Service role full access" on public.feature_requests
  for all using (true) with check (true);

-- ─── Feature Votes ───────────────────────────────────────
create table if not exists public.feature_votes (
  id              text primary key,
  feature_id      text not null references public.feature_requests(id) on delete cascade,
  user_id         text not null references public.users(id),
  created_at      timestamptz default now(),
  unique (feature_id, user_id)
);

create index if not exists idx_fv_feature on public.feature_votes (feature_id);
create index if not exists idx_fv_user on public.feature_votes (user_id);

alter table public.feature_votes enable row level security;
create policy "Service role full access" on public.feature_votes
  for all using (true) with check (true);

-- ─── Feature Comments ────────────────────────────────────
create table if not exists public.feature_comments (
  id              text primary key,
  feature_id      text not null references public.feature_requests(id) on delete cascade,
  user_id         text not null references public.users(id),
  content         text not null,
  created_at      timestamptz default now()
);

create index if not exists idx_fc_feature on public.feature_comments (feature_id, created_at);

alter table public.feature_comments enable row level security;
create policy "Service role full access" on public.feature_comments
  for all using (true) with check (true);
