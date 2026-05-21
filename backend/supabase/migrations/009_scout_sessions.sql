-- LP2: Scout AI conversation sessions
-- Each row = one continuous conversation between a user and Scout AI.
-- messages JSONB holds the ordered list of {role, content, ts} entries.
-- user_id is nullable (anonymous homepage sessions). triage_id links the
-- session back to the triage that initiated it, used by the opening builder
-- to pull the user's profile + plan context.

CREATE TABLE IF NOT EXISTS scout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  triage_id     UUID REFERENCES triage_responses(id) ON DELETE SET NULL,
  messages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scout_sessions_user_id_idx
  ON scout_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scout_sessions_triage_id_idx
  ON scout_sessions(triage_id) WHERE triage_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS scout_sessions_updated_at_idx
  ON scout_sessions(updated_at DESC);

ALTER TABLE scout_sessions ENABLE ROW LEVEL SECURITY;

-- No public policies: same pattern as 005_blog, 007_hub_content, 008_triage.
-- Backend writes via service-role key; frontend never reads this table directly.
