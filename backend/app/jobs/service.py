import asyncio
import json
import logging

from app.database import get_db
from app.companies.registry import COMPANY_REGISTRY
from app.fetchers.greenhouse import GreenhouseFetcher
from app.fetchers.lever import LeverFetcher
from app.fetchers.ashby import AshbyFetcher
from app.jobs.queries import UPSERT_JOB, DEACTIVATE_STALE_JOBS

logger = logging.getLogger(__name__)

_FETCHERS = {
    "greenhouse": GreenhouseFetcher(),
    "lever": LeverFetcher(),
    "ashby": AshbyFetcher(),
}

_SWE_INCLUDE = [
    "software", "engineer", "developer", "swe", "sde",
    "backend", "frontend", "fullstack", "full-stack", "full stack",
    "infrastructure", "platform", "ml engineer", "ai engineer",
    "systems", "site reliability", "sre",
]
_SWE_EXCLUDE = [
    "manager", "director", "recruiter", "designer",
    "product manager", "sales", "legal", "finance", "marketing",
    "data scientist", "analyst",
]


def filter_swe_roles(jobs):
    result = []
    for job in jobs:
        t = job.title.lower()
        if not any(kw in t for kw in _SWE_INCLUDE):
            continue
        if any(kw in t for kw in _SWE_EXCLUDE):
            # Allow "research scientist / engineer"
            if "scientist" in t and "research" not in t:
                continue
            if any(kw in t for kw in ["manager", "director", "recruiter", "designer", "sales", "legal", "finance", "marketing"]):
                continue
        result.append(job)
    return result


def detect_level(title: str) -> str:
    t = title.lower()
    if any(x in t for x in ["principal", "distinguished", "fellow"]):
        return "L7+"
    if any(x in t for x in ["staff", " l6 "]):
        return "L6"
    if any(x in t for x in ["senior", "sr.", " l5 ", "level 5"]):
        return "L5"
    if any(x in t for x in ["mid-level", " l4 ", "level 4", " ii "]):
        return "L4"
    if any(x in t for x in ["junior", "jr.", "new grad", "entry", " l3 "]):
        return "L3"
    return "L5"


async def _fetch_company(company: dict, company_id: int) -> int:
    ats = company["ats_type"]
    fetcher = _FETCHERS.get(ats)
    if not fetcher:
        logger.warning("No fetcher for ATS type: %s", ats)
        return 0

    jobs = await fetcher.fetch(company["board_id"])
    jobs = filter_swe_roles(jobs)

    async with get_db() as conn:
        count = 0
        for job in jobs:
            level = detect_level(job.title)
            try:
                await conn.execute(
                    UPSERT_JOB,
                    job.external_id,
                    company_id,
                    job.title,
                    job.location,
                    job.remote,
                    job.department,
                    level,
                    job.url,
                    job.description,
                    json.dumps(job.raw_json),
                )
                count += 1
            except Exception as e:
                logger.warning("Failed to upsert job %s: %s", job.external_id, e)
    return count


async def fetch_all_jobs() -> int:
    async with get_db() as conn:
        company_rows = await conn.fetch("SELECT id, slug FROM companies")
    company_id_map = {row["slug"]: row["id"] for row in company_rows}

    tasks = []
    for company in COMPANY_REGISTRY:
        cid = company_id_map.get(company["slug"])
        if cid:
            tasks.append(_fetch_company(company, cid))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    total = sum(r for r in results if isinstance(r, int))
    logger.info("Fetched %d SWE jobs total", total)

    # Deactivate jobs not seen in the last 60 days (no longer on the company board)
    async with get_db() as conn:
        result = await conn.execute(DEACTIVATE_STALE_JOBS)
        deactivated = int(result.split()[-1]) if result else 0
        if deactivated:
            logger.info("Deactivated %d stale jobs (not seen in 60 days)", deactivated)

    return total
