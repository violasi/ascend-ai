import logging
import re
import httpx

from app.fetchers.base import AbstractFetcher, NormalizedJob
from app.config import get_settings

logger = logging.getLogger(__name__)

_BASE = "https://boards-api.greenhouse.io/v1/boards/{board_id}/jobs?content=true"


def _strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html or "").strip()


class GreenhouseFetcher(AbstractFetcher):
    async def fetch(self, board_id: str) -> list[NormalizedJob]:
        url = _BASE.format(board_id=board_id)
        timeout = get_settings().fetch_timeout_seconds
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(url)
            if resp.status_code == 404:
                logger.warning("Greenhouse board not found: %s", board_id)
                return []
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.warning("Greenhouse fetch error for %s: %s", board_id, e)
            return []

        jobs: list[NormalizedJob] = []
        for job in data.get("jobs", []):
            location_parts = [o.get("name", "") for o in job.get("offices", [])]
            location = ", ".join(filter(None, location_parts)) or "Remote"
            remote = any(
                "remote" in str(loc).lower()
                for loc in [location] + [o.get("name", "") for o in job.get("offices", [])]
            )
            dept = ", ".join(d.get("name", "") for d in job.get("departments", []))
            description = _strip_html(job.get("content", ""))[:3000]
            jobs.append(
                NormalizedJob(
                    external_id=str(job["id"]),
                    title=job.get("title", ""),
                    location=location,
                    remote=remote,
                    department=dept,
                    url=job.get("absolute_url", ""),
                    description=description,
                    raw_json=job,
                )
            )
        return jobs
