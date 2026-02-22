-- ============================================================
-- HireFlow Seed Data
-- Run AFTER 001_schema.sql
-- Passwords are bcrypt hashes of "demo1234"
-- ============================================================

-- The bcrypt hash below corresponds to "demo1234"
-- Generated with: python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('demo1234'))"

do $$
declare
  pw text := '$2b$12$LJ3mFGaGMh0O7GCTfGbRVOWLqjS3MHVRhKCFRzGOPJt1XLmPqmd2.';
begin

-- ─── Demo Companies ──────────────────────────────────────
insert into public.users (id, email, hashed_password, role, company_name, industry, company_size, location)
values
  ('comp_1', 'techvault@demo.com',    pw, 'company', 'TechVault',    'Tech / SaaS',       '500-1000', 'San Francisco, CA'),
  ('comp_2', 'datapulseai@demo.com',  pw, 'company', 'DataPulse AI', 'AI / ML',           '50-200',   'Remote'),
  ('comp_3', 'formastudio@demo.com',  pw, 'company', 'Forma Studio', 'Design',            '50-200',   'New York, NY'),
  ('comp_4', 'cloudscale@demo.com',   pw, 'company', 'CloudScale',   'Cloud',             '200-500',  'Austin, TX'),
  ('comp_5', 'payloop@demo.com',      pw, 'company', 'PayLoop',      'Finance / Fintech', '200-500',  'Remote')
on conflict (id) do nothing;

-- ─── Demo Recruiter ──────────────────────────────────────
insert into public.users (id, email, hashed_password, role, name, agency, specializations)
values
  ('rec_1', 'recruiter@demo.com', pw, 'recruiter', 'Jordan Taylor', 'TalentBridge', '["Engineering", "Product", "Design"]'::jsonb)
on conflict (id) do nothing;

-- ─── Demo Jobs ───────────────────────────────────────────
insert into public.jobs (id, company_id, title, location, salary_min, salary_max, type, remote, description, required_skills, nice_skills, experience_level, status, applicant_count)
values
  ('job_1', 'comp_1', 'Senior React Developer',
   'San Francisco, CA', 160000, 200000, 'full-time', true,
   'Lead frontend architecture for our next-gen platform. You''ll work with a team of 8 engineers to build scalable React applications.',
   '["React", "TypeScript", "JavaScript"]'::jsonb,
   '["Next.js", "Redux", "Node.js"]'::jsonb,
   'Senior (6-9 yrs)', 'active', 23),

  ('job_2', 'comp_2', 'ML Engineer',
   'Remote', 180000, 230000, 'full-time', true,
   'Build and deploy production ML pipelines at scale. Work on cutting-edge NLP and recommendation systems.',
   '["Python", "Machine Learning", "PyTorch"]'::jsonb,
   '["MLOps", "AWS", "Docker"]'::jsonb,
   'Senior (6-9 yrs)', 'active', 45),

  ('job_3', 'comp_3', 'Product Designer',
   'New York, NY', 130000, 165000, 'full-time', false,
   'Shape the future of our design system and user experiences for B2B SaaS products.',
   '["Figma", "UX Research", "UI Design"]'::jsonb,
   '["Design Systems", "Prototyping", "Accessibility"]'::jsonb,
   'Mid Level (3-5 yrs)', 'active', 67),

  ('job_4', 'comp_4', 'DevOps Lead',
   'Austin, TX', 155000, 195000, 'full-time', true,
   'Lead our infrastructure team and modernize our cloud stack across AWS and GCP.',
   '["AWS", "Kubernetes", "Terraform"]'::jsonb,
   '["Docker", "CI/CD", "Linux"]'::jsonb,
   'Senior (6-9 yrs)', 'active', 18),

  ('job_5', 'comp_1', 'Frontend Architect',
   'Remote', 170000, 210000, 'contract', true,
   'Define frontend standards and mentor a team of 12 engineers building our design system.',
   '["React", "TypeScript", "Next.js"]'::jsonb,
   '["Design Systems", "JavaScript", "Redux"]'::jsonb,
   'Staff / Lead (10+ yrs)', 'active', 31),

  ('job_6', 'comp_5', 'Full Stack Developer',
   'Remote', 140000, 175000, 'full-time', true,
   'Build payment infrastructure used by millions of users worldwide.',
   '["Node.js", "React", "SQL"]'::jsonb,
   '["TypeScript", "Docker", "AWS"]'::jsonb,
   'Mid Level (3-5 yrs)', 'active', 54),

  ('job_7', 'comp_2', 'Data Scientist',
   'Seattle, WA', 145000, 185000, 'full-time', true,
   'Turn complex data into actionable business insights using statistical modeling and ML.',
   '["Python", "SQL", "Data Analysis"]'::jsonb,
   '["Machine Learning", "Pandas", "TensorFlow"]'::jsonb,
   'Mid Level (3-5 yrs)', 'active', 39),

  ('job_8', 'comp_4', 'Engineering Manager',
   'Denver, CO', 190000, 240000, 'full-time', true,
   'Lead a team of 15 engineers shipping core platform features.',
   '["Team Leadership", "Agile/Scrum", "Hiring"]'::jsonb,
   '["Roadmapping", "Mentoring", "Cross-functional"]'::jsonb,
   'Staff / Lead (10+ yrs)', 'active', 12)
on conflict (id) do nothing;

end $$;
