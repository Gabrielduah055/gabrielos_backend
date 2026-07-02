CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
  ) THEN
    UPDATE users
    SET
      first_name = COALESCE(first_name, NULLIF(split_part(COALESCE(full_name, name), ' ', 1), '')),
      last_name = COALESCE(last_name, NULLIF(regexp_replace(COALESCE(full_name, name), '^\S+\s*', ''), ''))
    WHERE first_name IS NULL OR last_name IS NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) THEN
    UPDATE users
    SET
      first_name = COALESCE(first_name, NULLIF(split_part(full_name, ' ', 1), '')),
      last_name = COALESCE(last_name, NULLIF(regexp_replace(full_name, '^\S+\s*', ''), ''))
    WHERE first_name IS NULL OR last_name IS NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
  ) THEN
    UPDATE users
    SET
      first_name = COALESCE(first_name, NULLIF(split_part(name, ' ', 1), '')),
      last_name = COALESCE(last_name, NULLIF(regexp_replace(name, '^\S+\s*', ''), ''))
    WHERE first_name IS NULL OR last_name IS NULL;
  END IF;
END $$;

UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users DROP COLUMN IF EXISTS full_name;

CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_unique
  ON users (firebase_uid)
  WHERE firebase_uid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (email)
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS scout_goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  keywords TEXT,
  location TEXT,
  sources TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  minimum_score INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunity_candidates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scout_goal_id BIGINT REFERENCES scout_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT,
  organization TEXT,
  source TEXT,
  link TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  why_it_matters TEXT,
  suggested_next_action TEXT,
  deadline TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id BIGINT REFERENCES opportunity_candidates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT,
  organization TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  deadline TIMESTAMP,
  priority TEXT NOT NULL DEFAULT 'medium',
  next_action TEXT,
  link TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS sources TEXT;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'weekly';
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS minimum_score INTEGER DEFAULT 70;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS scout_goal_id BIGINT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS why_it_matters TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS suggested_next_action TEXT;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE opportunity_candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS user_id BIGINT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS candidate_id BIGINT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'saved';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'description'
  ) THEN
    ALTER TABLE opportunities ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;

UPDATE scout_goals SET type = 'other' WHERE type IS NULL;
UPDATE scout_goals SET frequency = 'weekly' WHERE frequency IS NULL;
UPDATE scout_goals SET minimum_score = 70 WHERE minimum_score IS NULL;
UPDATE scout_goals SET is_active = true WHERE is_active IS NULL;
UPDATE scout_goals SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE scout_goals SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

UPDATE opportunity_candidates SET score = 0 WHERE score IS NULL;
UPDATE opportunity_candidates SET status = 'pending' WHERE status IS NULL;
UPDATE opportunity_candidates SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE opportunity_candidates SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

UPDATE opportunities SET status = 'saved' WHERE status IS NULL OR status = 'new';
UPDATE opportunities SET priority = 'medium' WHERE priority IS NULL;
UPDATE opportunities SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE opportunities SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

ALTER TABLE scout_goals ALTER COLUMN type SET DEFAULT 'other';
ALTER TABLE scout_goals ALTER COLUMN frequency SET DEFAULT 'weekly';
ALTER TABLE scout_goals ALTER COLUMN minimum_score SET DEFAULT 70;
ALTER TABLE scout_goals ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE scout_goals ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE scout_goals ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE opportunity_candidates ALTER COLUMN score SET DEFAULT 0;
ALTER TABLE opportunity_candidates ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE opportunity_candidates ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE opportunity_candidates ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'saved';
ALTER TABLE opportunities ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE opportunities ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE opportunities ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS scout_goals_user_id_idx ON scout_goals (user_id);
CREATE INDEX IF NOT EXISTS opportunity_candidates_user_id_idx ON opportunity_candidates (user_id);
CREATE INDEX IF NOT EXISTS opportunity_candidates_scout_goal_id_idx ON opportunity_candidates (scout_goal_id);
CREATE INDEX IF NOT EXISTS opportunities_user_id_idx ON opportunities (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_candidate_id_unique
  ON opportunities (candidate_id)
  WHERE candidate_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scout_goals_user_id_fkey'
  ) THEN
    ALTER TABLE scout_goals
      ADD CONSTRAINT scout_goals_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_candidates_user_id_fkey'
  ) THEN
    ALTER TABLE opportunity_candidates
      ADD CONSTRAINT opportunity_candidates_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_candidates_scout_goal_id_fkey'
  ) THEN
    ALTER TABLE opportunity_candidates
      ADD CONSTRAINT opportunity_candidates_scout_goal_id_fkey
      FOREIGN KEY (scout_goal_id) REFERENCES scout_goals(id) ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_user_id_fkey'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_candidate_id_fkey'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_candidate_id_fkey
      FOREIGN KEY (candidate_id) REFERENCES opportunity_candidates(id) ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scout_goals_type_check'
  ) THEN
    ALTER TABLE scout_goals
      ADD CONSTRAINT scout_goals_type_check
      CHECK (type IN ('job', 'scholarship', 'school_pilot', 'client_lead', 'contract', 'business', 'research', 'grant', 'other')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scout_goals_frequency_check'
  ) THEN
    ALTER TABLE scout_goals
      ADD CONSTRAINT scout_goals_frequency_check
      CHECK (frequency IN ('daily', 'weekly', 'monthly')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_candidates_type_check'
  ) THEN
    ALTER TABLE opportunity_candidates
      ADD CONSTRAINT opportunity_candidates_type_check
      CHECK (type IS NULL OR type IN ('job', 'scholarship', 'school_pilot', 'client_lead', 'contract', 'business', 'research', 'grant', 'other')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_candidates_status_check'
  ) THEN
    ALTER TABLE opportunity_candidates
      ADD CONSTRAINT opportunity_candidates_status_check
      CHECK (status IN ('pending', 'approved', 'ignored', 'rejected')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_type_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_type_check
      CHECK (type IS NULL OR type IN ('job', 'scholarship', 'school_pilot', 'client_lead', 'contract', 'business', 'research', 'grant', 'other')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_status_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_status_check
      CHECK (status IN ('saved', 'interested', 'contacted', 'applied', 'follow_up', 'negotiating', 'won', 'lost', 'archived')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'opportunities_priority_check'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_priority_check
      CHECK (priority IN ('low', 'medium', 'high')) NOT VALID;
  END IF;
END $$;

-- Scout goals can optionally target 'all' opportunity categories in a
-- single run (searches every type, classifies each result individually)
-- instead of being locked to one type. The constraint is dropped and
-- re-added on every boot (rather than guarded by IF NOT EXISTS on the
-- constraint name) so the allowed value list here always matches
-- SCOUT_GOAL_TYPES in application code.
ALTER TABLE scout_goals ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP;

ALTER TABLE scout_goals DROP CONSTRAINT IF EXISTS scout_goals_type_check;
ALTER TABLE scout_goals
  ADD CONSTRAINT scout_goals_type_check
  CHECK (type IN ('job', 'scholarship', 'school_pilot', 'client_lead', 'contract', 'business', 'research', 'grant', 'other', 'all')) NOT VALID;
