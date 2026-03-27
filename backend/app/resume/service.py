from __future__ import annotations
import json
import logging

import anthropic

from app.config import get_settings
from app.database import get_db

logger = logging.getLogger(__name__)

_HAIKU = "claude-haiku-4-5-20251001"
_OPUS = "claude-haiku-4-5"
_SONNET = "claude-haiku-4-5"


async def _get_client() -> anthropic.AsyncAnthropic:
    settings = get_settings()
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def parse_resume(resume_text: str) -> dict:
    """Extract structured profile from raw resume text using Claude Haiku."""
    client = await _get_client()
    message = await client.messages.create(
        model=_HAIKU,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Analyze this resume and return ONLY a JSON object (no markdown, no explanation) with:
{{
  "name": "full name or Anonymous",
  "level": "L3|L4|L5|L6|L7+",
  "years_experience": <integer>,
  "current_role": "current or most recent job title",
  "skills": ["skill1","skill2",...],
  "previous_companies": ["company1",...],
  "education": "brief summary e.g. BS CS Stanford",
  "headline": "2-sentence professional summary",
  "strengths": ["strength1","strength2","strength3"],
  "specializations": ["domain1","domain2"]
}}

Resume text:
{resume_text[:5000]}"""
        }]
    )
    try:
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        logger.warning("Failed to parse profile JSON: %s", e)
        return {
            "name": "Anonymous",
            "level": "L5",
            "years_experience": 5,
            "current_role": "Software Engineer",
            "skills": [],
            "previous_companies": [],
            "education": "",
            "headline": "",
            "strengths": [],
            "specializations": [],
        }


async def match_jobs(profile: dict, jobs: list[dict]) -> list[dict]:
    """Score and rank jobs against the candidate profile using Claude Haiku."""
    client = await _get_client()

    job_lines = "\n".join([
        f"ID:{j['id']}|{j['level']}|{j['title']}|{j['company_name']}|{'Remote' if j.get('remote') else j.get('location','') or 'Onsite'}"
        for j in jobs[:250]
    ])

    skills_str = ", ".join(profile.get("skills", []))
    level = profile.get("level", "L5")
    exp = profile.get("years_experience", 0)
    strengths = ", ".join(profile.get("strengths", []))
    prev_companies = ", ".join(profile.get("previous_companies", []))
    specializations = ", ".join(profile.get("specializations", []))

    message = await client.messages.create(
        model=_HAIKU,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": f"""You are a senior engineering recruiter. Rank the TOP 20 most suitable jobs for this candidate.

CANDIDATE:
- Level: {level} ({exp} years experience)
- Current role: {profile.get("current_role","")}
- Skills: {skills_str}
- Specializations: {specializations}
- Previous companies: {prev_companies}
- Strengths: {strengths}

JOBS (ID|Level|Title|Company|Location):
{job_lines}

Return ONLY a JSON array (no markdown) of the top 20 best matches:
[{{"job_id":<number>,"match_score":<0-100>,"match_reasons":["reason1","reason2"],"skill_gaps":["gap1"]}},...]

Scoring criteria:
- Skills overlap with job requirements (40%)
- Level alignment (30%)
- Role/domain relevance (20%)
- Growth opportunity (10%)
Respond with ONLY the JSON array."""
        }]
    )

    try:
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        ranked = json.loads(text)
    except Exception as e:
        logger.warning("Failed to parse job matches JSON: %s", e)
        ranked = [{"job_id": j["id"], "match_score": 50, "match_reasons": ["General fit"], "skill_gaps": []} for j in jobs[:20]]

    job_map = {j["id"]: j for j in jobs}
    result = []
    for r in ranked[:20]:
        jid = r.get("job_id")
        if jid and jid in job_map:
            job = job_map[jid]
            result.append({
                **r,
                "title": job["title"],
                "company_name": job["company_name"],
                "company_slug": job["company_slug"],
                "company_logo_url": job["company_logo_url"],
                "company_tier": job["company_tier"],
                "level": job["level"],
                "remote": job["remote"],
                "url": job["url"],
                "location": job.get("location", ""),
            })

    return sorted(result, key=lambda x: x.get("match_score", 0), reverse=True)


async def match_all_jobs(profile: dict, jobs: list[dict]) -> list[dict]:
    """Score and rank ALL jobs against the candidate profile (used for company-specific matching)."""
    if not jobs:
        return []

    client = await _get_client()

    job_lines = "\n".join([
        f"ID:{j['id']}|{j['level']}|{j['title']}|{j['company_name']}|{'Remote' if j.get('remote') else j.get('location', '') or 'Onsite'}"
        for j in jobs
    ])

    skills_str = ", ".join(profile.get("skills", []))
    level = profile.get("level", "L5")
    exp = profile.get("years_experience", 0)
    strengths = ", ".join(profile.get("strengths", []))
    prev_companies = ", ".join(profile.get("previous_companies", []))
    specializations = ", ".join(profile.get("specializations", []))

    n = len(jobs)
    top_n = min(n, 30)  # cap at 30 to keep response within token budget
    message = await client.messages.create(
        model=_HAIKU,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": f"""You are a senior engineering recruiter. Rank the TOP {top_n} most suitable jobs for this candidate.

CANDIDATE:
- Level: {level} ({exp} years experience)
- Current role: {profile.get("current_role", "")}
- Skills: {skills_str}
- Specializations: {specializations}
- Previous companies: {prev_companies}
- Strengths: {strengths}

JOBS (ID|Level|Title|Company|Location):
{job_lines}

Return ONLY a JSON array (no markdown) of the top {top_n} best matches ranked by score:
[{{"job_id":<number>,"match_score":<0-100>,"match_reasons":["reason1","reason2"],"skill_gaps":["gap1"]}},...]

Scoring criteria:
- Skills overlap with job requirements (40%)
- Level alignment (30%)
- Role/domain relevance (20%)
- Growth opportunity (10%)
Respond with ONLY the JSON array. Do not truncate — output all {top_n} entries."""
        }]
    )

    try:
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        ranked = json.loads(text)
    except Exception as e:
        logger.warning("Failed to parse company match JSON: %s", e)
        ranked = [{"job_id": j["id"], "match_score": 50, "match_reasons": ["General fit"], "skill_gaps": []} for j in jobs[:top_n]]

    job_map = {j["id"]: j for j in jobs}
    result = []
    for r in ranked[:top_n]:
        jid = r.get("job_id")
        if jid and jid in job_map:
            job = job_map[jid]
            result.append({
                **r,
                "title": job["title"],
                "company_name": job["company_name"],
                "company_slug": job["company_slug"],
                "company_logo_url": job["company_logo_url"],
                "company_tier": job["company_tier"],
                "level": job["level"],
                "remote": job["remote"],
                "url": job["url"],
                "location": job.get("location", ""),
            })

    return sorted(result, key=lambda x: x.get("match_score", 0), reverse=True)


async def analyze_resume(resume_text: str) -> dict:
    """Full pipeline: parse resume + fetch jobs + rank matches + persist result."""
    profile = await parse_resume(resume_text)
    logger.info("Parsed profile: %s (%s, %d yrs)", profile.get("name"), profile.get("level"), profile.get("years_experience", 0))

    async with get_db() as conn:
        rows = await conn.fetch(
            """
            SELECT j.id, j.title, j.level, j.location, j.remote,
                   j.url, j.description,
                   c.name AS company_name, c.slug AS company_slug,
                   c.logo_url AS company_logo_url, c.tier AS company_tier
            FROM jobs j
            JOIN companies c ON c.id = j.company_id
            WHERE j.active = TRUE
            ORDER BY j.id
            """
        )

    jobs = [dict(r) for r in rows]
    matches = await match_jobs(profile, jobs)
    logger.info("Matched %d jobs for %s", len(matches), profile.get("name"))

    # Persist analysis to database
    try:
        async with get_db() as conn:
            analysis_id = await conn.fetchval(
                """
                INSERT INTO resume_analyses
                    (candidate_name, candidate_level, resume_text, profile, matches)
                VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
                RETURNING id
                """,
                profile.get("name", "Anonymous"),
                profile.get("level", "L5"),
                resume_text,
                json.dumps(profile),
                json.dumps(matches),
            )
        logger.info("Stored resume analysis id=%d for %s", analysis_id, profile.get("name"))
    except Exception as e:
        logger.warning("Failed to persist resume analysis: %s", e)
        analysis_id = None

    return {"profile": profile, "matches": matches, "analysis_id": analysis_id}


async def generate_personalized_prep(
    job_id: int,
    content_type: str,
    resume_text: str,
) -> dict:
    """Generate a resume-aware prep plan using Claude Opus."""
    from app.prep.prompts import (
        build_coding_prompt, build_system_design_prompt,
        build_behavioral_prompt, build_company_tips_prompt, build_edge_tech_prompt,
    )

    _PROMPT_BUILDERS = {
        "coding": build_coding_prompt,
        "system_design": build_system_design_prompt,
        "behavioral": build_behavioral_prompt,
        "company_tips": build_company_tips_prompt,
        "edge_tech": build_edge_tech_prompt,
    }

    builder = _PROMPT_BUILDERS.get(content_type)
    if not builder:
        raise ValueError(f"Unknown content type: {content_type}")

    async with get_db() as conn:
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

    system_prompt, user_prompt = builder(
        title=job["title"],
        company_name=job["company_name"],
        level=job["level"],
        description=job["description"],
    )

    resume_snippet = resume_text[:2000]
    personalized_system = (
        system_prompt
        + "\n\nIMPORTANT: You have access to the candidate's resume. "
        "Tailor EVERY recommendation to their specific background — mention their actual companies, "
        "highlight their existing strengths, and focus on their specific gaps. "
        "Make this feel like advice from a senior engineer who has read their resume."
    )
    personalized_user = (
        f"CANDIDATE RESUME CONTEXT:\n{resume_snippet}\n\n"
        f"---\n\n{user_prompt}\n\n"
        "Remember: Reference the candidate's background throughout. "
        "Mention what they already know vs. what they need to learn."
    )

    client = await _get_client()
    message = await client.messages.create(
        model=_SONNET,
        max_tokens=4096,
        system=personalized_system,
        messages=[{"role": "user", "content": personalized_user}],
    )

    content = message.content[0].text
    logger.info("Generated personalized %s prep for job %d", content_type, job_id)
    return {
        "job_id": job_id,
        "content_type": content_type,
        "content": content,
        "model": _SONNET,
        "cached": False,
        "personalized": True,
    }
