from __future__ import annotations
import math
from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.jobs.queries import LIST_JOBS, COUNT_JOBS, GET_JOB_DETAIL

router = APIRouter(tags=["jobs"])


@router.get("/jobs")
async def list_jobs(
    q: str | None = Query(None, description="Full-text search"),
    level: str | None = Query(None, description="L3|L4|L5|L6|L7+"),
    remote: bool | None = Query(None),
    company: int | None = Query(None, description="company_id"),
    tier: str | None = Query(None, description="faang_plus|ai_startup"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * limit
    async with get_db() as conn:
        rows = await conn.fetch(LIST_JOBS, q, level, remote, company, tier, limit, offset)
        total = await conn.fetchval(COUNT_JOBS, q, level, remote, company, tier)

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total else 0,
    }


@router.get("/jobs/{job_id}")
async def get_job(job_id: int):
    async with get_db() as conn:
        row = await conn.fetchrow(GET_JOB_DETAIL, job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    return dict(row)
