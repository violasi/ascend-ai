from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter(tags=["profiles"])


async def _require_analysis(conn, analysis_id: int):
    row = await conn.fetchrow(
        "SELECT id, candidate_name, candidate_level, profile, analyzed_at FROM resume_analyses WHERE id=$1",
        analysis_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail=f"Profile {analysis_id} not found")
    return row


@router.get("/profiles/{analysis_id}/data")
async def get_profile_data(analysis_id: int):
    """Return profile + applied job IDs + prep progress for a session."""
    async with get_db() as conn:
        analysis = await _require_analysis(conn, analysis_id)
        applied_rows = await conn.fetch(
            "SELECT job_id FROM user_applications WHERE analysis_id=$1",
            analysis_id,
        )
        progress_rows = await conn.fetch(
            "SELECT job_id, content_type FROM prep_progress WHERE analysis_id=$1",
            analysis_id,
        )

    progress: dict[str, list[str]] = {}
    for row in progress_rows:
        key = str(row["job_id"])
        progress.setdefault(key, []).append(row["content_type"])

    return {
        "analysis_id": analysis_id,
        "candidate_name": analysis["candidate_name"],
        "candidate_level": analysis["candidate_level"],
        "profile": analysis["profile"],
        "analyzed_at": analysis["analyzed_at"].isoformat(),
        "applied_job_ids": [r["job_id"] for r in applied_rows],
        "prep_progress": progress,
    }


@router.post("/profiles/{analysis_id}/apply/{job_id}")
async def mark_applied(analysis_id: int, job_id: int):
    """Record that this profile applied to a job."""
    async with get_db() as conn:
        await _require_analysis(conn, analysis_id)
        await conn.execute(
            """
            INSERT INTO user_applications (analysis_id, job_id)
            VALUES ($1, $2)
            ON CONFLICT (analysis_id, job_id) DO NOTHING
            """,
            analysis_id,
            job_id,
        )
    return {"applied": True, "job_id": job_id}


@router.delete("/profiles/{analysis_id}/apply/{job_id}")
async def unmark_applied(analysis_id: int, job_id: int):
    """Remove an application record."""
    async with get_db() as conn:
        await conn.execute(
            "DELETE FROM user_applications WHERE analysis_id=$1 AND job_id=$2",
            analysis_id,
            job_id,
        )
    return {"applied": False, "job_id": job_id}


@router.post("/profiles/{analysis_id}/progress/{job_id}/{content_type}")
async def mark_prep_viewed(analysis_id: int, job_id: int, content_type: str):
    """Record that a prep plan tab was viewed for a job."""
    valid = {"coding", "system_design", "behavioral", "company_tips", "edge_tech"}
    if content_type not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid content_type: {content_type}")
    async with get_db() as conn:
        await _require_analysis(conn, analysis_id)
        await conn.execute(
            """
            INSERT INTO prep_progress (analysis_id, job_id, content_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (analysis_id, job_id, content_type) DO UPDATE SET viewed_at = NOW()
            """,
            analysis_id,
            job_id,
            content_type,
        )
    return {"ok": True, "content_type": content_type}
