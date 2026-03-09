from fastapi import APIRouter
from app.database import get_db

router = APIRouter(tags=["companies"])


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
