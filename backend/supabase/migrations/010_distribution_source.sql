-- Distribution attribution: add a short `source` tag to triage_responses
-- and scout_sessions so a post-specific URL like hyrly.ai/?src=li2 can be
-- attributed in analytics queries.
--
-- Tags are short hand-chosen identifiers (e.g. 'li1', 'li2', 'x1',
-- 'h1b-landing'), set by the frontend from the ?src= query param and
-- written through by the backend. NULL means "unknown / pre-tracking
-- traffic" (organic, direct, or pre-2026-05-24 rows).
--
-- Follows the same RLS pattern as 008/009: writes only via service-role
-- key, no public read policy.

ALTER TABLE triage_responses
  ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE scout_sessions
  ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS triage_responses_source_idx
  ON triage_responses(source) WHERE source IS NOT NULL;

CREATE INDEX IF NOT EXISTS scout_sessions_source_idx
  ON scout_sessions(source) WHERE source IS NOT NULL;
