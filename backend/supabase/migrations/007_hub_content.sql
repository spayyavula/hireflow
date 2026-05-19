-- ─── Hub Content (cached AI copy for SEO hub pages) ──────
-- One row per hub slug (e.g. 'react', 'react/location/austin').
-- See docs/superpowers/specs/2026-05-16-sp2-ssr-seo-design.md §A.
create table if not exists public.hub_content (
  slug         text primary key,
  copy         text not null,
  faq_json     jsonb default '[]'::jsonb,
  generated_at timestamptz default now()
);

alter table public.hub_content enable row level security;
create policy "Service role full access" on public.hub_content
  for all using (true) with check (true);
