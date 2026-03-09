from __future__ import annotations
import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
_scheduler: AsyncIOScheduler | None = None


async def _refresh_job():
    from app.jobs.service import fetch_all_jobs
    logger.info("Scheduler: starting job refresh")
    count = await fetch_all_jobs()
    logger.info("Scheduler: refreshed %d jobs", count)


def start_scheduler():
    global _scheduler
    from app.config import get_settings
    interval_hours = get_settings().job_refresh_interval_hours

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _refresh_job,
        trigger="interval",
        hours=interval_hours,
        id="job_refresh",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (interval: %dh)", interval_hours)

    # Kick off initial fetch in background
    loop = asyncio.get_event_loop()
    loop.create_task(_refresh_job())


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
