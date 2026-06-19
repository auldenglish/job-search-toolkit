CREATE TABLE IF NOT EXISTS applications (
  id              SERIAL PRIMARY KEY,
  company         TEXT NOT NULL,
  role            TEXT NOT NULL,
  jd_url          TEXT,
  date_applied    DATE,
  status          TEXT,
  closed_reason   TEXT,
  resume_version  TEXT,
  cover_letter    BOOLEAN DEFAULT false,
  notes           TEXT,
  next_activity_date DATE,
  follow_up_date  DATE,
  todos           JSONB DEFAULT '[]',
  comments        JSONB DEFAULT '[]',
  jd_text         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
