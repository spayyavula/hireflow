-- LP1: Layoff Triage responses
-- Each row = one completed triage submission.
-- answers JSONB holds the raw 10 question/answer pairs.
-- plan JSONB holds the deterministic plan generator's output.
-- user_id is NULL for anonymous submissions (homepage triage requires no signup).

CREATE TABLE IF NOT EXISTS triage_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  answers       JSONB NOT NULL,
  plan          JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS triage_responses_user_id_idx
  ON triage_responses(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS triage_responses_created_at_idx
  ON triage_responses(created_at DESC);

-- RLS: anonymous inserts allowed via the service-role key (backend writes
-- everything); reads only via service role. The frontend never reads this
-- table directly; it gets the plan back from the POST response.
ALTER TABLE triage_responses ENABLE ROW LEVEL SECURITY;

-- No public policies = nothing readable/writable without service role.
-- This matches the pattern in 005_blog.sql and 007_hub_content.sql.
