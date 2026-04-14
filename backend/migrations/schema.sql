CREATE TABLE IF NOT EXISTS companies (
    id          BIGSERIAL    PRIMARY KEY,
    name        TEXT         NOT NULL UNIQUE,
    slug        TEXT         NOT NULL UNIQUE,
    ats_type    TEXT         NOT NULL,
    board_id    TEXT         NOT NULL,
    tier        TEXT         NOT NULL,
    hq          TEXT         NOT NULL DEFAULT '',
    size        TEXT         NOT NULL DEFAULT '',
    logo_url    TEXT         NOT NULL DEFAULT '',
    about       TEXT         NOT NULL DEFAULT '',
    loop_desc   TEXT         NOT NULL DEFAULT '',
    comp_range  TEXT         NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id            BIGSERIAL    PRIMARY KEY,
    external_id   TEXT         NOT NULL,
    company_id    BIGINT       REFERENCES companies(id) ON DELETE CASCADE,
    title         TEXT         NOT NULL,
    location      TEXT         NOT NULL DEFAULT '',
    remote        BOOLEAN      NOT NULL DEFAULT FALSE,
    department    TEXT         NOT NULL DEFAULT '',
    level         TEXT         NOT NULL DEFAULT 'L5',
    url           TEXT         NOT NULL,
    description   TEXT         NOT NULL DEFAULT '',
    raw_json      JSONB        NOT NULL DEFAULT '{}',
    fetched_at    TIMESTAMPTZ  DEFAULT NOW(),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (company_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_fts ON jobs USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_jobs_level   ON jobs(level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote  ON jobs(remote);
CREATE INDEX IF NOT EXISTS idx_jobs_active  ON jobs(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);

CREATE TABLE IF NOT EXISTS resume_analyses (
    id              BIGSERIAL    PRIMARY KEY,
    candidate_name  TEXT         NOT NULL DEFAULT 'Anonymous',
    candidate_level TEXT         NOT NULL DEFAULT 'L5',
    resume_text     TEXT         NOT NULL,
    profile         JSONB        NOT NULL DEFAULT '{}',
    matches         JSONB        NOT NULL DEFAULT '[]',
    analyzed_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_at ON resume_analyses(analyzed_at DESC);

CREATE TABLE IF NOT EXISTS user_applications (
    id           BIGSERIAL    PRIMARY KEY,
    analysis_id  BIGINT       REFERENCES resume_analyses(id) ON DELETE CASCADE,
    job_id       BIGINT       REFERENCES jobs(id) ON DELETE CASCADE,
    applied_at   TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (analysis_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_analysis ON user_applications(analysis_id);

CREATE TABLE IF NOT EXISTS prep_progress (
    id            BIGSERIAL    PRIMARY KEY,
    analysis_id   BIGINT       REFERENCES resume_analyses(id) ON DELETE CASCADE,
    job_id        BIGINT       REFERENCES jobs(id) ON DELETE CASCADE,
    content_type  TEXT         NOT NULL,
    viewed_at     TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (analysis_id, job_id, content_type)
);
CREATE INDEX IF NOT EXISTS idx_prep_progress_analysis ON prep_progress(analysis_id);

CREATE TABLE IF NOT EXISTS prep_plans (
    id             BIGSERIAL    PRIMARY KEY,
    job_id         BIGINT       REFERENCES jobs(id) ON DELETE CASCADE,
    content_type   TEXT         NOT NULL,
    content        TEXT         NOT NULL,
    model          TEXT         NOT NULL DEFAULT 'claude-opus-4-6',
    input_tokens   INT          DEFAULT 0,
    output_tokens  INT          DEFAULT 0,
    cost_usd       NUMERIC(10,6) DEFAULT 0,
    generated_at   TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (job_id, content_type)
);
