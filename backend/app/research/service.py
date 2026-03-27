from __future__ import annotations
import logging
import re

import anthropic

from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

_MODEL = "claude-haiku-4-5"
_MAX_TOKENS = 6000

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS company_research (
    company_key   TEXT PRIMARY KEY,
    company_name  TEXT NOT NULL,
    content       TEXT NOT NULL,
    model         TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    generated_at  TIMESTAMPTZ DEFAULT NOW()
);
"""


def _normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "_", name.lower().strip())


def _build_prompt(company_name: str, role_hint: str) -> tuple[str, str]:
    system = (
        "You are a senior engineering career coach with deep knowledge of tech company "
        "interview processes, engineering cultures, and compensation. Your advice is based on "
        "publicly available information, community reports (Glassdoor, Blind, Levels.fyi), "
        "and engineering blogs. Be specific, practical, and honest. Format using markdown."
    )

    role_context = f" specifically for {role_hint} roles" if role_hint else " for software engineering roles"

    user = f"""Generate a comprehensive interview preparation guide for **{company_name}**{role_context}.

Structure your response with these exact sections:

## Company Overview
Brief description of what {company_name} builds, engineering scale, notable tech challenges.

## Interview Loop Structure
Exact breakdown: number of rounds, types (phone screen / technical / system design / behavioral / bar raiser), approximate duration, who you'll meet. Be specific about format.

## Past Interview Experiences
Summarize what real candidates have reported about interviewing at {company_name}, based on community sources (Glassdoor, Blind, Leetcode Discuss, Reddit r/cscareerquestions, TeamBlind). Include:
- **Common questions reported**: Specific coding problems, system design prompts, or behavioral questions that appear repeatedly across candidate reports.
- **Candidate sentiment**: Overall difficulty rating (Easy / Medium / Hard), how welcoming or intense the process felt, recruiter responsiveness.
- **Offer vs. no-offer patterns**: What candidates who got offers say they did differently; mistakes reported by those who didn't pass.
- **Surprises & gotchas**: Anything that caught candidates off guard — unexpected round added, unusual evaluation criteria, or format changes.
- **Timeline**: Typical time from application to offer, how long each stage takes.
Be explicit about what is based on community reports vs. official company statements.

## What They Test
### Coding & Algorithms
Specific DSA patterns they favor, difficulty level, whether they allow pseudocode, time pressure.

### System Design
Topics they commonly ask about (specific to their domain), level-calibrated depth, what good looks like vs. what fails.

### Behavioral / Culture Fit
Their specific values and leadership principles (if any), common behavioral questions, red flags they watch for.

## Tech Stack
Languages, frameworks, infrastructure, data systems they use. Source any known engineering blog posts or public info.

## Engineering Culture
Team structure, on-call expectations, deployment cadence, how decisions are made, remote/hybrid policy.

## Compensation Deep Dive
Provide a detailed breakdown of how {company_name} compensates engineers. Mark all figures as approximate, sourced from Levels.fyi, Blind, or public reports.

### Level Structure
Map {company_name}'s internal levels to industry equivalents (e.g., L3 = new grad, L5 = senior, L7 = staff). Include what each level means in terms of scope and expectations.

### Compensation by Level
For each level from new grad to staff/principal (use a markdown table if possible):
- **Base salary** — range for Bay Area / NYC; note if remote is different
- **Equity (RSUs)** — annual grant value, vesting schedule (cliff + monthly/quarterly), refresh policy
- **Annual bonus** — target % and how performance multipliers typically affect it
- **Estimated total comp (TC)** — low / median / high range

### Location & Remote Pay Policy
Does {company_name} adjust pay by location? Is there a pay cut for remote? Are there remote-friendly hubs with strong pay?

### Equity Mechanics
- Grant structure: new hire grant size, vesting cliff, refresh cadence
- What happens to unvested equity if you leave or are laid off?
- Is there a double-trigger acceleration clause?

### Negotiation Insights
- What levers candidates have typically used successfully (sign-on, equity bump, level bump)
- How much flexibility {company_name} typically shows in negotiations
- Whether competing offers are effective and how to use them
- Common mistakes candidates make in comp negotiation at this company

## Pro Tips
5-7 specific, actionable tips for interviewing at {company_name}. Include what sets top candidates apart, what mistakes to avoid, and any company-specific quirks.

## Resources
Links to useful public resources: engineering blog, Glassdoor, Blind threads, Levels.fyi page, GitHub orgs, public talks.

Be honest if information is limited or uncertain. Mark estimates as approximate."""

    return system, user


async def _ensure_table() -> None:
    async with get_db() as conn:
        await conn.execute(_CREATE_TABLE)


async def get_or_generate_research(company_name: str, role_hint: str = "") -> dict:
    await _ensure_table()

    key = _normalize(company_name)

    async with get_db() as conn:
        cached = await conn.fetchrow(
            "SELECT * FROM company_research WHERE company_key = $1", key
        )
        if cached:
            logger.info("Cache hit for company research: %s", company_name)
            return {**dict(cached), "cached": True}

    system_prompt, user_prompt = _build_prompt(company_name, role_hint)

    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    logger.info("Generating company research for: %s", company_name)
    message = await client.messages.create(
        model=_MODEL,
        max_tokens=_MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    content = message.content[0].text
    logger.info("Generated research for %s (%d tokens)", company_name, message.usage.output_tokens)

    async with get_db() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO company_research (company_key, company_name, content, model)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (company_key) DO UPDATE SET
                content = EXCLUDED.content,
                model = EXCLUDED.model,
                generated_at = NOW()
            RETURNING *
            """,
            key, company_name, content, _MODEL,
        )

    return {**dict(row), "cached": False}
