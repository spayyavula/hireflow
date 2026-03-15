-- ─── Blog Posts (Pressroom CMS) ──────────────────────────
create table if not exists public.blog_posts (
  id              text primary key,
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  body_markdown   text not null,
  body_html       text not null,
  excerpt         text,
  cover_image_url text,
  author_id       text references public.users(id),
  author_name     text not null,
  author_bio      text,
  category        text not null check (category in (
    'career-playbook', 'resume-lab', 'interview-decoded',
    'hiring-signals', 'company-spotlight', 'engineering-culture',
    'remote-work', 'ai-future-work', 'salary-compass', 'recruiter-craft'
  )),
  tags            jsonb default '[]'::jsonb,
  related_skills  jsonb default '[]'::jsonb,
  seo_title       text,
  seo_description text,
  seo_keywords    jsonb default '[]'::jsonb,
  reading_time_min integer default 5,
  status          text not null default 'draft' check (status in (
    'draft', 'scheduled', 'published', 'archived'
  )),
  published_at    timestamptz,
  scheduled_for   timestamptz,
  featured        boolean default false,
  view_count      integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_blog_slug on public.blog_posts (slug);
create index if not exists idx_blog_status on public.blog_posts (status);
create index if not exists idx_blog_category on public.blog_posts (category);
create index if not exists idx_blog_published on public.blog_posts (published_at desc);
create index if not exists idx_blog_featured on public.blog_posts (featured) where featured = true;
create index if not exists idx_blog_views on public.blog_posts (view_count desc);

alter table public.blog_posts enable row level security;
create policy "Service role full access" on public.blog_posts
  for all using (true) with check (true);
