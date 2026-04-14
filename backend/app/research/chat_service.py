from __future__ import annotations
import logging
import uuid

import openai

from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

_MAX_TOKENS = 2048
_HISTORY_LIMIT = 20

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS company_chat_messages (
    id           BIGSERIAL    PRIMARY KEY,
    company_key  TEXT         NOT NULL,
    session_id   TEXT         NOT NULL,
    role         TEXT         NOT NULL,
    content      TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);
"""

_CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS company_chat_messages_lookup
    ON company_chat_messages (company_key, session_id, created_at);
"""


async def ensure_chat_table() -> None:
    """Called once at app startup — not per-request."""
    async with get_db() as conn:
        await conn.execute(_CREATE_TABLE)
        await conn.execute(_CREATE_INDEX)


def _validate_session_id(session_id: str) -> bool:
    try:
        uuid.UUID(session_id, version=4)
        return True
    except (ValueError, AttributeError):
        return False


async def get_latest_session(company_key: str) -> str | None:
    """Return the most recently active session_id for this company, or None."""
    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            SELECT session_id FROM company_chat_messages
            WHERE company_key = $1
            ORDER BY created_at DESC
            LIMIT 1
            """,
            company_key,
        )
    return row["session_id"] if row else None


async def get_history(company_key: str, session_id: str) -> list[dict]:
    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT id, role, content
            FROM company_chat_messages
            WHERE company_key = $1 AND session_id = $2
            ORDER BY created_at ASC
            """,
            company_key, session_id,
        )
    return [{"id": r["id"], "role": r["role"], "content": r["content"]} for r in rows]


def _sanitize(text: str) -> str:
    """Strip NUL bytes and other problematic characters."""
    return text.replace("\x00", "")


async def send_message(company_key: str, session_id: str, message: str) -> str:
    message = _sanitize(message)
    # Load research context
    async with get_db() as conn:
        research_row = await conn.fetchrow(
            "SELECT company_name, content FROM company_research WHERE company_key = $1",
            company_key,
        )
    if not research_row:
        raise ValueError(f"No research found for company_key: {company_key}")

    company_name = research_row["company_name"]
    research_content = research_row["content"]

    # Load last N messages for context window
    async with get_db() as conn:
        history_rows = await conn.fetch(
            """
            SELECT role, content FROM company_chat_messages
            WHERE company_key = $1 AND session_id = $2
            ORDER BY created_at DESC
            LIMIT $3
            """,
            company_key, session_id, _HISTORY_LIMIT,
        )
    history = [{"role": r["role"], "content": r["content"]} for r in reversed(history_rows)]

    system_prompt = f"""You are an expert career coach and technical interview advisor.
You have deep knowledge of {company_name}'s engineering culture, interview process, and compensation.

Here is the latest research report on {company_name}:
---
{research_content}
---

When answering questions:
- Be specific and actionable
- Use the research above as your primary source
- When explaining processes, loops, or comparisons, use HTML block elements to make answers visually scannable:
  - Flow diagrams: use divs with inline styles (background, border, border-radius, padding) for boxes connected with → arrows
  - Tables: use <table> with inline styles for compensation or level comparisons
  - Callout blocks: use a <div> with border-left, padding, and background-color for tips and warnings
- Keep answers focused (200-400 words max)
- Always tie advice back to {company_name} specifically
- Use dark-theme friendly colors: backgrounds like #1e293b, text like #94a3b8 or #e2e8f0, accents like #3b82f6, #10b981, #f59e0b"""

    messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": message}]

    settings = get_settings()
    client = openai.AsyncOpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url)

    logger.info("Chat message for %s (session %s...)", company_key, session_id[:8])
    response = await client.chat.completions.create(
        model=settings.llm_model,
        max_tokens=_MAX_TOKENS,
        messages=messages,
    )

    reply = _sanitize(response.choices[0].message.content)

    # Save both messages
    async with get_db() as conn:
        await conn.execute(
            "INSERT INTO company_chat_messages (company_key, session_id, role, content) VALUES ($1, $2, $3, $4)",
            company_key, session_id, "user", message,
        )
        await conn.execute(
            "INSERT INTO company_chat_messages (company_key, session_id, role, content) VALUES ($1, $2, $3, $4)",
            company_key, session_id, "assistant", reply,
        )

    return reply


async def clear_history(company_key: str, session_id: str) -> int:
    async with get_db() as conn:
        result = await conn.execute(
            "DELETE FROM company_chat_messages WHERE company_key = $1 AND session_id = $2",
            company_key, session_id,
        )
    # result is like "DELETE 14"
    try:
        return int(result.split()[-1])
    except (ValueError, IndexError):
        return 0
