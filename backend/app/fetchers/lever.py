import logging
import re
import httpx

from app.fetchers.base import AbstractFetcher, NormalizedJob
from app.config import get_settings

logger = logging.getLogger(__name__)

_BASE = "https://api.lever.co/v0/postings/{board_id}?mode=json"


def _strip_html(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html or "").strip()


class LeverFetcher(AbstractFetcher):
    async def fetch(self, board_id: str) -> list[NormalizedJob]:
        url = _BASE.format(board_id=board_id)
        timeout = get_settings().fetch_timeout_seconds
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(url)
            if resp.status_code == 404:
                logger.warning("Lever board not found: %s", board_id)
                return []
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.warning("Lever fetch error for %s: %s", board_id, e)
            return []

        jobs: list[NormalizedJob] = []
        for job in data if isinstance(data, list) else []:
            location = job.get("categories", {}).get("location", "") or "Remote"
            remote = "remote" in location.lower()
            dept = job.get("categories", {}).get("department", "")
            description_parts = [
                _strip_html(section.get("content", ""))
                for section in (job.get("descriptionBody", {}).get("descriptionSections") or [])
            ]
            description = " ".join(description_parts)[:3000]
            jobs.append(
                NormalizedJob(
                    external_id=job.get("id", ""),
                    title=job.get("text", ""),
                    location=location,
                    remote=remote,
                    department=dept,
                    url=job.get("hostedUrl", job.get("applyUrl", "")),
                    description=description,
                    raw_json=job,
                )
            )
        return jobs
