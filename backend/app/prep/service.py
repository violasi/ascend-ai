from __future__ import annotations
import logging
from datetime import datetime

import anthropic

from app.config import get_settings
from app.database import get_db
from app.prep.prompts import (
    build_coding_prompt,
    build_system_design_prompt,
    build_behavioral_prompt,
    build_company_tips_prompt,
    build_edge_tech_prompt,
)

logger = logging.getLogger(__name__)

_MODEL = "claude-haiku-4-5"
_MAX_TOKENS = 4096

_PROMPT_BUILDERS = {
    "coding": build_coding_prompt,
    "system_design": build_system_design_prompt,
    "behavioral": build_behavioral_prompt,
    "company_tips": build_company_tips_prompt,
    "edge_tech": build_edge_tech_prompt,
}

# Cost per million tokens (input / output)
_COST_TABLE = {
    "claude-opus-4-6": (15.0, 75.0),
    "claude-sonnet-4-6": (3.0, 15.0),
}


def _calc_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    inp, out = _COST_TABLE.get(model, (15.0, 75.0))
    return (input_tokens * inp + output_tokens * out) / 1_000_000


async def get_or_generate_prep(job_id: int, content_type: str) -> dict:
    async with get_db() as conn:
        cached = await conn.fetchrow(
            "SELECT * FROM prep_plans WHERE job_id = $1 AND content_type = $2",
            job_id, content_type,
        )
        if cached:
            return {**dict(cached), "cached": True}

        job = await conn.fetchrow(
            """
            SELECT j.title, j.level, j.description, c.name AS company_name
            FROM jobs j JOIN companies c ON c.id = j.company_id
            WHERE j.id = $1
            """,
            job_id,
        )

    if not job:
        raise ValueError(f"Job {job_id} not found")

    builder = _PROMPT_BUILDERS.get(content_type)
    if not builder:
        raise ValueError(f"Unknown content type: {content_type}")

    system_prompt, user_prompt = builder(
        title=job["title"],
        company_name=job["company_name"],
        level=job["level"],
        description=job["description"],
    )

    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    logger.info("Generating %s prep for job %d (%s @ %s)", content_type, job_id, job["title"], job["company_name"])

    message = await client.messages.create(
        model=_MODEL,
        max_tokens=_MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    content = message.content[0].text
    input_tokens = message.usage.input_tokens
    output_tokens = message.usage.output_tokens
    cost_usd = _calc_cost(_MODEL, input_tokens, output_tokens)

    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO prep_plans (job_id, content_type, content, model, input_tokens, output_tokens, cost_usd)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (job_id, content_type) DO UPDATE SET
                content = EXCLUDED.content,
                model = EXCLUDED.model,
                input_tokens = EXCLUDED.input_tokens,
                output_tokens = EXCLUDED.output_tokens,
                cost_usd = EXCLUDED.cost_usd,
                generated_at = NOW()
            RETURNING *
            """,
            job_id, content_type, content, _MODEL,
            input_tokens, output_tokens, cost_usd,
        )

    logger.info("Generated prep plan: %d tokens in, %d out, $%.4f", input_tokens, output_tokens, cost_usd)
    return {**dict(row), "cached": False}
