import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["companies"])


class MatchRequest(BaseModel):
    analysis_id: int


@router.get("/companies")
async def list_companies():
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT c.id, c.name, c.slug, c.ats_type, c.tier, c.hq, c.size,
                   c.logo_url, c.about, c.loop_desc, c.comp_range,
                   COUNT(j.id) FILTER (WHERE j.active) AS open_roles
            FROM companies c
            LEFT JOIN jobs j ON j.company_id = c.id
            GROUP BY c.id
            ORDER BY c.tier, c.name
            """
        )
    companies = [dict(r) for r in rows]
    return {
        "faang_plus": [c for c in companies if c["tier"] == "faang_plus"],
        "ai_startup": [c for c in companies if c["tier"] == "ai_startup"],
        "yc_unicorn": [c for c in companies if c["tier"] == "yc_unicorn"],
    }


@router.get("/companies/{slug}")
async def get_company(slug: str):
    async with get_db() as conn:
        company = await conn.fetchrow(
            """
            SELECT c.*, COUNT(j.id) FILTER (WHERE j.active) AS open_roles
            FROM companies c
            LEFT JOIN jobs j ON j.company_id = c.id
            WHERE c.slug = $1
            GROUP BY c.id
            """,
            slug,
        )
        if not company:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Company not found")

        jobs = await conn.fetch(
            """
            SELECT id, title, level, location, remote, department, url
            FROM jobs
            WHERE company_id = $1 AND active = TRUE
            ORDER BY level DESC, title
            """,
            company["id"],
        )

    return {**dict(company), "jobs": [dict(j) for j in jobs]}


@router.post("/companies/{slug}/match")
async def match_company_jobs(slug: str, body: MatchRequest):
    async with get_db() as conn:
        company = await conn.fetchrow("SELECT id, name FROM companies WHERE slug = $1", slug)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        analysis = await conn.fetchrow(
            "SELECT profile FROM resume_analyses WHERE id = $1", body.analysis_id
        )
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        jobs = await conn.fetch(
            """
            SELECT j.id, j.title, j.level, j.location, j.remote, j.url,
                   c.name AS company_name, c.slug AS company_slug,
                   c.logo_url AS company_logo_url, c.tier AS company_tier
            FROM jobs j JOIN companies c ON c.id = j.company_id
            WHERE j.company_id = $1 AND j.active = TRUE
            ORDER BY j.level DESC, j.title
            """,
            company["id"],
        )

    profile = json.loads(analysis["profile"])
    job_list = [dict(j) for j in jobs]

    from app.resume.service import match_all_jobs
    ranked = await match_all_jobs(profile, job_list)
    logger.info("Matched %d jobs for company %s (analysis %d)", len(ranked), slug, body.analysis_id)
    return {"matches": ranked, "company_name": company["name"], "total": len(ranked)}
