UPSERT_JOB = """
INSERT INTO jobs (external_id, company_id, title, location, remote, department, level, url, description, raw_json)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
ON CONFLICT (company_id, external_id) DO UPDATE SET
    title       = EXCLUDED.title,
    location    = EXCLUDED.location,
    remote      = EXCLUDED.remote,
    department  = EXCLUDED.department,
    level       = EXCLUDED.level,
    url         = EXCLUDED.url,
    description = EXCLUDED.description,
    raw_json    = EXCLUDED.raw_json,
    fetched_at  = NOW(),
    active      = TRUE
"""

LIST_JOBS = """
SELECT j.id, j.title, j.level, j.location, j.remote, j.department, j.url, j.fetched_at,
       c.id AS company_id, c.name AS company_name, c.slug AS company_slug,
       c.logo_url AS company_logo_url, c.tier AS company_tier
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.active = TRUE
  AND ($1::text IS NULL OR to_tsvector('english', j.title || ' ' || j.description) @@ plainto_tsquery('english', $1))
  AND ($2::text IS NULL OR j.level = $2)
  AND ($3::boolean IS NULL OR j.remote = $3)
  AND ($4::bigint IS NULL OR j.company_id = $4)
  AND ($5::text IS NULL OR c.tier = $5)
ORDER BY j.fetched_at DESC, j.id DESC
LIMIT $6 OFFSET $7
"""

COUNT_JOBS = """
SELECT COUNT(*)
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.active = TRUE
  AND ($1::text IS NULL OR to_tsvector('english', j.title || ' ' || j.description) @@ plainto_tsquery('english', $1))
  AND ($2::text IS NULL OR j.level = $2)
  AND ($3::boolean IS NULL OR j.remote = $3)
  AND ($4::bigint IS NULL OR j.company_id = $4)
  AND ($5::text IS NULL OR c.tier = $5)
"""

GET_JOB_DETAIL = """
SELECT j.id, j.title, j.level, j.location, j.remote, j.department, j.url, j.fetched_at,
       j.description,
       c.id AS company_id, c.name AS company_name, c.slug AS company_slug,
       c.logo_url AS company_logo_url, c.tier AS company_tier
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.id = $1 AND j.active = TRUE
"""
