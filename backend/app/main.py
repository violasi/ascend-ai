import logging
import pathlib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_pool, close_pool, get_db, apply_schema
from app.companies.router import router as companies_router
from app.jobs.router import router as jobs_router
from app.prep.router import router as prep_router
from app.resume.router import router as resume_router
from app.profiles.router import router as profiles_router
from app.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await create_pool(settings.database_url)

    schema_path = pathlib.Path(__file__).parent.parent / "migrations" / "schema.sql"
    async with get_db() as conn:
        await apply_schema(conn, str(schema_path))

    # Seed companies from registry
    from app.companies.registry import COMPANY_REGISTRY
    async with get_db() as conn:
        for c in COMPANY_REGISTRY:
            await conn.execute(
                """
                INSERT INTO companies (name, slug, ats_type, board_id, tier, hq, size, logo_url, about, loop_desc, comp_range)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                ON CONFLICT (slug) DO UPDATE SET
                    ats_type=EXCLUDED.ats_type, board_id=EXCLUDED.board_id,
                    tier=EXCLUDED.tier, hq=EXCLUDED.hq, size=EXCLUDED.size,
                    logo_url=EXCLUDED.logo_url, about=EXCLUDED.about,
                    loop_desc=EXCLUDED.loop_desc, comp_range=EXCLUDED.comp_range
                """,
                c["name"], c["slug"], c["ats_type"], c["board_id"], c["tier"],
                c.get("hq", ""), c.get("size", ""), c.get("logo_url", ""),
                c.get("about", ""), c.get("loop_desc", ""), c.get("comp_range", ""),
            )

    start_scheduler()
    logger.info("Application started")

    yield

    stop_scheduler()
    await close_pool()
    logger.info("Application shutdown")


app = FastAPI(title="SWE Job Prep Dashboard", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(prep_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")


@app.get("/health")
async def health():
    from app.database import get_pool
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            job_count = await conn.fetchval("SELECT COUNT(*) FROM jobs WHERE active = TRUE")
        return {"status": "ok", "db": "ok", "jobs": job_count}
    except Exception as e:
        return {"status": "error", "db": str(e), "jobs": 0}


@app.post("/api/refresh")
async def refresh_jobs():
    from app.jobs.service import fetch_all_jobs
    count = await fetch_all_jobs()
    return {"refreshed": count}
