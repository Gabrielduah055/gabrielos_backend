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

CREATE TABLE IF NOT EXISTS opportunities (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  type TEXT,
  description TEXT NOT NULL,
  link TEXT,
  score INTEGER,
  reason TEXT,
  next_action TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
