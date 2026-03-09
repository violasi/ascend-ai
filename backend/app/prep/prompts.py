"""
Five prompt-builder functions for the prep plan generation system.
Each receives (title, company_name, level, description_snippet) and returns
a (system, user) tuple to pass to Claude.
"""


def build_coding_prompt(title: str, company_name: str, level: str, description: str) -> tuple[str, str]:
    system = (
        "You are an elite software engineering interview coach with deep knowledge of "
        "FAANG and AI startup interview processes. You produce actionable, specific, and "
        "highly personalized coding interview preparation plans. Use markdown with clear "
        "headers, bullet points, and code examples where relevant."
    )
    user = f"""Generate a comprehensive coding interview prep plan for:
- Role: {title}
- Company: {company_name}
- Level: {level}
- Job Description Snippet: {description[:1000]}

Your plan MUST include:

## 1. Critical DSA Patterns (8-10 patterns)
List the 8-10 most important data structures and algorithm patterns for this specific role/level/company combo.
For each pattern: name, why it matters at {company_name}, difficulty, frequency.

## 2. 6-Week LeetCode Study Plan
Week-by-week plan with:
- Focus topic(s) for each week
- Number of problems to solve per week (Easy/Medium/Hard split)
- Which pattern to master each week

## 3. Must-Do Problems (15 problems)
List 15 specific LeetCode problems (with IDs) that are:
- High-signal for {company_name} specifically
- Representative of patterns you'll actually see
For each: problem ID, name, pattern, difficulty, why it matters for {company_name}/{level}

## 4. Company-Specific Coding Style Guide
How to approach coding specifically for {company_name}:
- Preferred coding style (verbosity, comments, variable naming)
- What interviewers care about most
- Known company quirks and preferences
- How to handle edge cases (their expectation)

## 5. Complexity Cheat Sheet
Quick reference for the patterns listed above:
- Time complexity
- Space complexity
- When to use vs alternatives

Make this extremely specific to {company_name} at {level}. No generic advice."""
    return system, user


def build_system_design_prompt(title: str, company_name: str, level: str, description: str) -> tuple[str, str]:
    system = (
        "You are a senior staff engineer and system design interview expert who has conducted "
        "hundreds of interviews at top tech companies. You create detailed, level-calibrated "
        "system design preparation guides. Use markdown with clear structure."
    )
    user = f"""Generate a complete system design interview prep guide for:
- Role: {title}
- Company: {company_name}
- Level: {level}
- Job Description Snippet: {description[:1000]}

Your guide MUST include:

## 1. Core Concepts by Priority
The most important distributed systems concepts for {level} at {company_name}, ordered by importance.
Include: CAP theorem, consistency models, scaling patterns, data modeling, API design.

## 2. Five Company-Specific Design Questions
Generate 5 actual-style system design questions that {company_name} asks at {level}.
For each: question, what they're testing, level-appropriate depth expected.

## 3. Step-by-Step Design Framework
A repeatable 45-minute framework for {company_name}'s style:
- Minutes 0-5: Requirements clarification (exact questions to ask)
- Minutes 5-15: High-level design
- Minutes 15-30: Deep dive
- Minutes 30-40: Bottlenecks and trade-offs
- Minutes 40-45: Wrap-up

## 4. Level-Calibrated Depth Guide ({level})
What {level} is expected to know vs. what would be impressive:
- Must demonstrate: (failing these is a reject)
- Good-to-have: (L+1 signal)
- Overkill topics to skip

## 5. {company_name} Architecture Insights
Real architectural decisions and patterns {company_name} is known for.
How their actual systems influence what they look for in interviews.

## 6. 30-Minute Mock Question with Worked Example
A full question with a complete worked answer at {level}-appropriate depth.

Be specific to {company_name} and {level}. Avoid generic textbook answers."""
    return system, user


def build_behavioral_prompt(title: str, company_name: str, level: str, description: str) -> tuple[str, str]:
    system = (
        "You are an executive career coach and former engineering hiring manager at multiple "
        "FAANG companies. You specialize in behavioral interview preparation and compensation "
        "negotiation. Create specific, compelling STAR story frameworks. Use markdown."
    )
    user = f"""Generate a complete behavioral interview prep guide for:
- Role: {title}
- Company: {company_name}
- Level: {level}
- Job Description Snippet: {description[:1000]}

Your guide MUST include:

## 1. Eight STAR Story Templates
Create detailed story frameworks for these scenarios (adapt to {company_name}'s culture):
1. Influencing without authority
2. Conflict with a teammate or manager
3. Failure and recovery
4. Ownership of a critical system
5. Cross-functional collaboration
6. Driving innovation
7. Scaling a system or team
8. Operating under extreme ambiguity

For each: situation template, action framework, result metrics to include, what {company_name} specifically values.

## 2. Company-Specific LP/Values Mapping
Map stories to {company_name}'s specific values/leadership principles:
- If Amazon: all 16 Leadership Principles with specific story angles for each
- If Google: Googleyness + role-related Googler attributes
- If Meta: Focus, Move Fast, Build Awesome Things
- Otherwise: their stated company values + interview culture

## 3. Bar Raiser / Senior Evaluator Playbook
What the most senior person in the loop is evaluating:
- Green flags (hire signals)
- Red flags (reject signals)
- What "exceptional" looks like at {level}
- Disqualifying behaviors to avoid

## 4. Manager Round Guide for {level}
How to ace the "working with your manager" and cross-team rounds at {level}.
What they're looking for in terms of scope, influence, and maturity.

## 5. Compensation Negotiation Tactics
- When to bring up competing offers
- How to negotiate at {company_name} specifically
- Equity refresh vs. signing bonus trade-offs
- Script for common negotiation scenarios at {level}

Be specific to {company_name}. Include real examples and concrete language to use."""
    return system, user


def build_company_tips_prompt(title: str, company_name: str, level: str, description: str) -> tuple[str, str]:
    system = (
        "You are an insider at top tech companies with deep knowledge of their interview "
        "processes, engineering culture, and compensation structures. You provide candid, "
        "actionable insider intelligence. Use markdown."
    )
    user = f"""Generate a complete insider guide for interviewing at {company_name} for:
- Role: {title}
- Level: {level}
- Job Description Snippet: {description[:1000]}

Your guide MUST include:

## 1. Exact Interview Loop Structure
For {level} at {company_name}:
- Total number of rounds
- Type of each round (coding, system design, behavioral, etc.)
- Who you typically meet (title/role of interviewers)
- Duration of each round
- Virtual vs. on-site format

## 2. Cultural Values & "Hell Yes" Signals
What {company_name} truly values (beyond their public values page):
- 5 specific behaviors that make interviewers excited
- How to demonstrate these in your answers
- Real cultural fit signals

## 3. Red Flags to Avoid
Specific things that have gotten candidates rejected at {company_name}:
- Behavioral red flags
- Technical red flags
- Communication red flags

## 4. Realistic Total Compensation at {level}
Breakdown of expected TC at {company_name} for {level}:
- Base salary range
- Annual equity grant (RSU value/year)
- Signing bonus
- Annual bonus/target
- Total TC range
- Vesting schedule
- Refreshes and promo bumps

## 5. Engineering Culture Deep Dive
- Tech stack actually used day-to-day
- On-call expectations
- Deployment cadence
- Code review culture
- Work-life balance reality (not what HR says)

## 6. Resources & Insider Intel
- Best Glassdoor/Blind/Levels.fyi filters for {company_name}
- Engineering blog posts worth reading before the interview
- Public talks by engineers there
- GitHub repos to know

## 7. 30/60/90 Day Onboarding Reality
What the first 3 months actually look like at {company_name} at {level}.

Be candid and specific. Use real information, not generic company-speak."""
    return system, user


def build_edge_tech_prompt(title: str, company_name: str, level: str, description: str) -> tuple[str, str]:
    system = (
        "You are a top-of-band staff engineer recruiter and technical coach who knows exactly "
        "which specialized skills command maximum compensation at AI companies and FAANG. "
        "You create precise, actionable technical skill development plans. Use markdown."
    )
    user = f"""Generate an edge technology skills guide for achieving top-of-band compensation for:
- Role: {title}
- Company: {company_name}
- Level: {level}
- Job Description Snippet: {description[:1000]}

Your guide MUST include:

## 1. Top-of-Band Skills at {company_name}
Specific technical skills that command highest compensation at {company_name} for {level}.

For AI/ML companies, prioritize:
- LLM fine-tuning (LoRA, QLoRA, full fine-tune)
- RLHF/RLAIF pipelines
- Inference optimization (vLLM, TensorRT, flash attention, speculative decoding)
- Distributed training (FSDP, DeepSpeed, Megatron-LM)
- Eval frameworks and red-teaming

For infrastructure roles:
- eBPF and kernel networking
- Storage systems internals
- Consensus algorithms (Raft/Paxos implementations)

For backend roles:
- High-throughput systems design
- Lock-free data structures
- SIMD and CPU optimization

## 2. How to Signal These Skills in Interviews
- Specific things to say (and how to naturally bring them up)
- Open source contributions that demonstrate expertise
- Side projects that signal top-of-band at {company_name}
- Red flags to avoid when discussing cutting-edge topics

## 3. 90-Day Learning Sprint
Week-by-week learning plan for the top 3 missing skills:
- Weeks 1-4: Foundation
- Weeks 5-8: Applied projects
- Weeks 9-12: Contribution and visibility

For each week: specific resource (course/paper/repo), hours/week, concrete deliverable.

## 4. Open Source Visibility Strategy
How to build a portfolio that gets recruiters reaching out from {company_name}:
- Which repos to contribute to
- How to get your contributions noticed
- LinkedIn/Twitter strategy for attracting attention

## 5. {level} → {_next_level(level)} Promotion Criteria
Once hired, what does promotion look like at {company_name}:
- Technical bar for next level
- Scope and impact expectations
- Timeline (median, fast track)
- How to advocate for yourself

## 6. Competing Offer Strategy
How to use other offers to maximize TC at {company_name}:
- Which companies create the best leverage against {company_name}
- Timing strategy
- Specific scripts

Be extremely specific and actionable. This is for a serious candidate aiming for top 10% TC."""
    return system, user


def _next_level(level: str) -> str:
    mapping = {"L3": "L4", "L4": "L5", "L5": "L6", "L6": "L7+", "L7+": "Distinguished"}
    return mapping.get(level, "next level")
