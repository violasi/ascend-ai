from fastapi import APIRouter, HTTPException

from app.prep.models import ContentType
from app.prep.service import get_or_generate_prep

router = APIRouter(tags=["prep"])


@router.get("/jobs/{job_id}/prep/{content_type}")
async def get_prep(job_id: int, content_type: ContentType):
    try:
        result = await get_or_generate_prep(job_id, content_type.value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prep generation failed: {e}")
