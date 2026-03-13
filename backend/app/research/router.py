import logging

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, validator

from app.research.service import get_or_generate_research
from app.research.chat_service import get_history, send_message, clear_history, get_latest_session, _validate_session_id

logger = logging.getLogger(__name__)
router = APIRouter(tags=["research"])


class ResearchRequest(BaseModel):
    company_name: str
    role_hint: str = ""


class ChatRequest(BaseModel):
    company_key: str
    session_id: str
    message: str

    @validator("session_id")
    def validate_session_id(cls, v):
        if not _validate_session_id(v):
            raise ValueError("session_id must be a valid UUID v4")
        return v

    @validator("message")
    def validate_message(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("message cannot be empty")
        if len(v) > 2000:
            raise ValueError("message too long (max 2000 chars)")
        return v

    @validator("company_key")
    def validate_company_key(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("company_key is required")
        return v


@router.post("/research/company")
async def research_company(body: ResearchRequest):
    name = body.company_name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="company_name is required")
    if len(name) > 200:
        raise HTTPException(status_code=400, detail="company_name too long")
    try:
        return await get_or_generate_research(name, body.role_hint.strip())
    except Exception as e:
        logger.exception("Company research failed for %s", name)
        raise HTTPException(status_code=500, detail=f"Research generation failed: {e}")


@router.post("/research/chat")
async def chat_with_company(body: ChatRequest):
    try:
        reply = await send_message(body.company_key, body.session_id, body.message)
        return {"reply": reply}
    except ValueError as e:
        msg = str(e)
        if "No research found" in msg:
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        logger.exception("Chat failed for %s", body.company_key)
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")


@router.get("/research/chat/{company_key}")
async def get_chat_history(
    company_key: str,
    session_id: str = Query(..., description="UUID v4 session identifier"),
):
    if not _validate_session_id(session_id):
        raise HTTPException(status_code=400, detail="session_id must be a valid UUID v4")
    messages = await get_history(company_key, session_id)
    return {"messages": messages, "company_key": company_key}


@router.get("/research/chat/{company_key}/latest-session")
async def get_latest_chat_session(company_key: str):
    """Return the most recently active session_id for a company, or null if none."""
    session_id = await get_latest_session(company_key)
    return {"session_id": session_id}


@router.delete("/research/chat/{company_key}")
async def delete_chat_history(
    company_key: str,
    session_id: str = Query(..., description="UUID v4 session identifier"),
):
    if not _validate_session_id(session_id):
        raise HTTPException(status_code=400, detail="session_id must be a valid UUID v4")
    deleted = await clear_history(company_key, session_id)
    return {"deleted": deleted}
