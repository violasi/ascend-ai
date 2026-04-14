# Ascend — AI Career Intelligence Platform (Multi-Provider Fork)

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Engine-Any%20OpenAI--Compatible-6366F1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Stack-Next.js%2015%20+%20FastAPI-0D0F18?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Jobs-1000+%20Live%20Roles-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Companies-43%20Elite-F59E0B?style=for-the-badge" />
</p>

<p align="center">
  <strong>Land top-of-band at FAANG+ and AI unicorns.</strong><br/>
  Upload your resume → AI-match to best-fit roles → Get a deeply personalized end-to-end interview prep plan.<br/>
  Research any company's interview loop — even ones not in the tracked 43.
</p>

---

## Fork Info

This is a fork of [RajuRoopani/ascend-ai](https://github.com/RajuRoopani/ascend-ai).

### What Changed

The original project was hardcoded to use Anthropic Claude API. This fork replaces it with the **OpenAI Python SDK**, making the project work with **any OpenAI-compatible LLM provider** by simply changing environment variables.

| | Original | This Fork |
|---|----------|-----------|
| **SDK** | `anthropic` | `openai` (OpenAI-compatible) |
| **Supported Providers** | Anthropic only | OpenAI, DeepSeek, MiniMax, Moonshot, Together AI, etc. |
| **Config** | `ANTHROPIC_API_KEY` | `LLM_API_KEY` + `LLM_BASE_URL` + `LLM_MODEL` + `LLM_MODEL_STRONG` |
| **Schema** | Table creation order bug | Fixed (`resume_analyses` now created before tables that reference it) |

#### Modified Files

- `backend/requirements.txt` — `anthropic` → `openai`
- `backend/app/config.py` — New LLM config fields with defaults
- `backend/app/prep/service.py` — OpenAI SDK, model from config
- `backend/app/resume/service.py` — OpenAI SDK, model from config
- `backend/app/research/service.py` — OpenAI SDK, model from config
- `backend/app/research/chat_service.py` — OpenAI SDK, system prompt as message
- `backend/migrations/schema.sql` — Fixed table creation order
- `docker-compose.yml` — New env vars
- `.env.example` — Multi-provider config examples

---

## Demo

https://github.com/user-attachments/assets/ascend-demo.mp4

> Full walkthrough: job board → search & filter → job detail + AI prep plans → company directory → company research → career match

---

## Screenshots

### Live Job Board — 1,000+ roles, refreshed every 6 hours
![Ascend Job Board](docs/ascend-homepage.png)

### Company Intelligence — 43 elite companies with interview loops & TC ranges
![Ascend Companies](docs/ascend-companies.png)

### AI Interview Prep — 5 prep types per role
![Ascend Job Detail](docs/ascend-job-detail.png)

### Career Match — Resume intelligence
![Ascend Career Match](docs/ascend-match.png)

### Company Research — Interview intel for any company, not just the 43 tracked
![Ascend Research](docs/ascend-research.png)

---

## Getting Started

### Prerequisites
- Docker & Docker Compose (or run locally with PostgreSQL)
- An API key from any OpenAI-compatible provider

### Quick Start (Docker)

```bash
git clone https://github.com/violasi/ascend-ai.git
cd ascend-ai

# Configure
cp .env.example .env
# Edit .env — fill in your LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

# Launch
docker compose up -d

# Wait ~30s for first job fetch, then open:
open http://localhost:3001
```

### Quick Start (Local, without Docker)

```bash
# 1. Install & start PostgreSQL
brew install postgresql@16 && brew services start postgresql@16
createdb job_prep_dashboard
psql -d job_prep_dashboard -c "CREATE USER jobprep WITH PASSWORD 'jobprep'; GRANT ALL PRIVILEGES ON DATABASE job_prep_dashboard TO jobprep; GRANT ALL ON SCHEMA public TO jobprep;"

# 2. Configure
cp .env.example backend/.env
# Edit backend/.env — fill in your API key and model config

# 3. Start backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# 4. Start frontend (new terminal)
cd frontend && npm install && npm run dev
# Open http://localhost:3000
```

### Provider Configuration Examples

Edit `.env` (or `backend/.env` for local dev):

```bash
# === OpenAI ===
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_MODEL_STRONG=gpt-4o

# === DeepSeek ===
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
LLM_MODEL_STRONG=deepseek-chat

# === MiniMax ===
LLM_API_KEY=xxx
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_MODEL=MiniMax-Text-01
LLM_MODEL_STRONG=MiniMax-Text-01

# === Moonshot ===
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k
LLM_MODEL_STRONG=moonshot-v1-32k

# === Together AI ===
LLM_API_KEY=xxx
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/Llama-3-70b-chat-hf
LLM_MODEL_STRONG=meta-llama/Llama-3-70b-chat-hf
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3001 (Docker) / :3000 (local) | Next.js app |
| Backend API | http://localhost:8001 | FastAPI + Swagger at /docs |
| PostgreSQL | localhost:5433 (Docker) / :5432 (local) | jobprep/jobprep |

---

## Features

### 1. Resume Intelligence Pipeline
```
Your resume text
    ↓ LLM (profile extraction + skills graph)
Parsed profile: level, skills, companies, strengths, 10+ dimensions
    ↓ LLM (parallel scoring against 1,000+ live roles)
Every role scored: match%, match_reasons, skill_gaps
    ↓ Top 20 matches with explanations
    ↓ "Personalized Prep" → stronger LLM model with your resume context
Hyper-personalized prep plan referencing your actual background
```

### 2. Live Job Intelligence
A **job board + intelligence layer** built exclusively for elite SWE candidates targeting AI companies and FAANG+. Refreshes 1,000+ roles from Greenhouse, Lever, and Ashby APIs every 6 hours.

### 3. Five AI Prep Dimensions Per Role

| Type | What You Get |
|------|-------------|
| Coding Plan | 8-10 DSA patterns, 6-week LeetCode roadmap, 15 must-do problems |
| System Design | Level-calibrated depth, 5 company-specific questions, worked mock |
| Behavioral | 8 STAR story templates, all 16 Amazon LPs mapped, bar raiser playbook |
| Company Tips | Exact loop structure, TC ranges by level, cultural signals |
| Edge Tech | Top-of-band skills (LLM infra, eBPF, distributed systems), promo criteria |

Plans are cached in PostgreSQL after first generation — instant on repeat access.

### 4. Company Research — Any Company
The **Research tab** accepts any company name and generates a full interview intelligence brief in ~30-60 seconds. Results are cached.

### 5. Persistent Profile & Progress Tracking
Sessions are fully restorable: applied jobs, prep progress, and resume matches persist across sessions.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│                  (Next.js 15 App Router)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ Rewrites /api/* → :8001
┌────────────────────────▼────────────────────────────────────┐
│              FastAPI Backend (Python 3.12)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  /jobs   │ │/companies│ │  /prep   │ │   /resume    │   │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └──────┬───────┘   │
│       │                         │               │            │
│  ┌────▼─────────────────────────▼───────────────▼───────┐   │
│  │           PostgreSQL 16 (asyncpg)                     │   │
│  │  companies · jobs (GIN FTS) · prep_plans (cached)    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────┐  ┌──────────────────────────┐   │
│  │  APScheduler (6h)     │  │  OpenAI-Compatible LLM   │   │
│  │  Greenhouse/Lever/    │  │  Any provider via         │   │
│  │  Ashby ATS fetchers   │  │  LLM_BASE_URL config     │   │
│  └───────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, Geist Font |
| **Backend** | FastAPI (Python 3.12), asyncpg, APScheduler |
| **Database** | PostgreSQL 16 (FTS with GIN index) |
| **AI** | Any OpenAI-compatible API (configurable model + provider) |
| **PDF Parsing** | pypdf (server-side extraction for uploaded resumes) |
| **ATS Sources** | Greenhouse API, Lever API, Ashby API |
| **Infrastructure** | Docker Compose or local dev |

---

## API Reference

```
GET    /api/jobs                                        # Paginated (q, level, remote, company, tier)
GET    /api/jobs/{id}                                   # Job detail
GET    /api/jobs/{id}/prep/{type}                       # Get/generate cached prep plan
POST   /api/jobs/{id}/prep/{type}/personalized          # Resume-personalized prep plan
POST   /api/resume/analyze                              # Parse resume → profile + job matches
POST   /api/resume/parse-pdf                            # Extract text from uploaded PDF
GET    /api/profiles/{id}/data                          # Profile + applied jobs + prep progress
POST   /api/profiles/{id}/apply/{job_id}                # Mark job as applied
POST   /api/research/company                            # AI research brief for any company (cached)
GET    /api/companies                                   # All companies grouped by tier
GET    /api/companies/{slug}                            # Company profile + open roles
POST   /api/refresh                                     # Trigger manual job refresh
GET    /health                                          # Health check
```

**Prep types:** `coding` · `system_design` · `behavioral` · `company_tips` · `edge_tech`

---

## Company Coverage (43)

**FAANG++ & Big Tech (11):** Google · Meta · Amazon · Apple · Netflix · Microsoft · Nvidia · OpenAI · Anthropic · DeepMind · xAI

**Leading AI Startups (20):** Scale AI · Harvey · Sierra · Cursor · ElevenLabs · Perplexity · Modal · Weaviate · Together AI · Runway · Hugging Face · Mistral AI · Cohere · Replit · Anyscale · LangChain · Character AI · Weights & Biases · Pika · Cognition

**YC Alumni & High-Growth Unicorns (12):** Stripe · Databricks · Plaid · Rippling · Brex · Notion · Linear · Vercel · Supabase · Discord · Ramp · Airtable

---

## Project Structure

```
ascend-ai/
├── backend/
│   ├── app/
│   │   ├── companies/     # Registry of 43 companies + router
│   │   ├── jobs/          # Paginated listing, level detection, SWE filter
│   │   ├── prep/          # AI prep generation + caching
│   │   ├── resume/        # PDF parsing + AI resume analysis + job matching
│   │   ├── profiles/      # Session tracking: applied jobs + prep progress
│   │   ├── research/      # AI company research for any company (cached)
│   │   ├── fetchers/      # Greenhouse, Lever, Ashby ATS fetchers
│   │   └── scheduler.py   # 6-hour background refresh
│   └── migrations/schema.sql
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Live job board
        │   ├── match/page.tsx        # Career Match (resume upload + AI matching)
        │   ├── jobs/[id]/page.tsx    # Job detail + AI prep accordion
        │   ├── companies/            # Company directory + profiles
        │   └── research/page.tsx     # Company Research
        └── components/
            ├── ui/CompanyLogo.tsx    # Smart logo with gradient-initials fallback
            ├── jobs/                 # JobCard, JobGrid, JobFilters, LevelBadge
            ├── prep/                 # PrepAccordion (standard + personalized)
            └── layout/               # Navbar, Footer
```

---

*Forked from [RajuRoopani/ascend-ai](https://github.com/RajuRoopani/ascend-ai) · Modified to support any OpenAI-compatible LLM provider.*
