# Company Research Chat — Design Spec

**Date:** 2026-03-12
**Feature:** Persistent side-panel chat on the company research page
**Status:** Approved for implementation

---

## Overview

When a research result is loaded, the page splits into two resizable panels. The left panel shows the existing research markdown (unchanged). The right panel is a new persistent chat interface where users can ask follow-up questions grounded in the company's research report. Chat history is stored in Postgres and reloaded per company × browser session.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Side Panel (Persistent Split) | Research + chat always visible. Resizable divider. Best for deep-dive sessions. |
| Starter prompts | 6 Prompt Chips | Clickable suggestions shown when chat is empty. Disappear once conversation starts. |
| Response rendering | Markdown + HTML Block Diagrams | AI returns HTML-aware responses. Rendered via DOMPurify + `dangerouslySetInnerHTML`. |
| Chat history | Backend (Postgres) | Persists across devices. Keyed by `company_key + session_id` (UUID in localStorage). |

---

## Architecture

### Layer Overview

```
Browser (Client)
  └── ResearchPage (MODIFIED)
        ├── PanelGroup [react-resizable-panels]
        │     ├── Panel (left) → MarkdownRenderer (unchanged)
        │     ├── PanelResizeHandle
        │     └── Panel (right) → CompanyChat (NEW)
        │           ├── ChatHeader
        │           ├── PromptChips (when empty)
        │           ├── ChatMessage ×N (sanitized HTML)
        │           └── ChatInput

Next.js Proxy (unchanged)
  └── api/[...path] → forwards to backend

FastAPI Backend
  └── research/router.py (MODIFIED)
        ├── POST /api/research/chat
        ├── GET  /api/research/chat/{company_key}
        └── DELETE /api/research/chat/{company_key}
  └── research/chat_service.py (NEW)
        └── load history → call Claude (with research ctx) → save messages

Postgres
  ├── company_research (unchanged)
  └── company_chat_messages (NEW)

Claude API (claude-sonnet-4-6)
  └── System: research report content
  └── Messages: last 20 from history + new user message
```

---

## Data Flow

### On Page Load (history fetch)
1. `ResearchPage` receives research result → mounts `CompanyChat`
2. `CompanyChat` reads `session_id` from localStorage (creates UUID if missing)
3. `GET /api/research/chat/{company_key}?session_id=...`
4. Backend queries `company_chat_messages` WHERE `company_key + session_id`
5. Returns messages → render list, or show prompt chips if empty

### On Message Send
1. User types → hits send
2. Optimistic UI: user message appears immediately
3. `POST /api/research/chat` with `{ company_key, session_id, message }`
4. Backend loads last 20 messages from DB
5. Fetches `company_research.content` for this `company_key` (grounding context)
6. Calls Claude with `system=research_report` + `messages=[history + new]`
7. Saves both user message and assistant reply to DB
8. Returns `{ reply, message_id }` → render `ChatMessage`

---

## Database Schema

```sql
CREATE TABLE company_chat_messages (
  id           BIGSERIAL    PRIMARY KEY,
  company_key  TEXT         NOT NULL,   -- normalized slug e.g. "stripe"
  session_id   TEXT         NOT NULL,   -- UUID from browser localStorage
  role         TEXT         NOT NULL,   -- 'user' | 'assistant'
  content      TEXT         NOT NULL,   -- raw text / HTML string
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Fast history lookup per company × session
CREATE INDEX ON company_chat_messages (company_key, session_id, created_at);
```

**Key design choices:**
- `company_key` matches `company_research.company_key` — loose coupling, no FK
- `session_id` is a UUID from localStorage — per-browser identity without auth
- `role` matches Claude API message format — passed directly to `messages.create()`
- `content` stored as raw HTML/text — no re-parsing needed on load
- Table auto-created on first call via `_ensure_table()` (same pattern as `company_research`)
- History window sent to Claude capped at **last 20 messages** for context/latency

---

## API Endpoints

### POST /api/research/chat
Send a message. Returns AI reply. Saves both messages to DB.

```
Request:  { company_key: str, session_id: str, message: str }
Response: { reply: str, message_id: int }
Errors:   400 missing fields / message > 2000 chars
          404 company_key not found in company_research
          500 Claude API failure
```

### GET /api/research/chat/{company_key}
Load full chat history for a company × session.

```
Query:    ?session_id=uuid
Response: { messages: [{role, content, id}], company_key: str }
```

### DELETE /api/research/chat/{company_key}
Clear history (triggered by "🗑 Clear" button).

```
Query:    ?session_id=uuid
Response: { deleted: int }
```

---

## AI Prompt Design

```python
SYSTEM = f"""
You are an expert career coach and technical interview advisor.
You have deep knowledge of {company_name}'s engineering culture,
interview process, and compensation.

Here is the latest research report on {company_name}:
---
{research_content}
---

When answering questions:
- Be specific and actionable
- Use the research above as your primary source
- When explaining processes, loops, or comparisons, use HTML
  block elements to make answers visually scannable:
    · Flow diagrams: divs with inline styles for boxes + arrows
    · Tables: <table> for compensation or level comparisons
    · Callout blocks: colored <div> with border-left for tips
- Keep answers focused (200-400 words max)
- Always tie advice back to {company_name} specifically
"""
```

Messages array: last 20 from DB + new user message.

---

## Component Design

### CompanyChat.tsx (NEW)
```typescript
interface Props {
  companyKey: string      // e.g. "stripe"
  companyName: string     // e.g. "Stripe"
}
```
Manages: `messages[]`, `loading`, `sending`, `error` state.
On mount: loads history from API.
On send: optimistic update → POST → append reply.
On clear: DELETE → reset messages.

### ChatMessage.tsx (NEW)
```typescript
interface Props {
  role: 'user' | 'assistant'
  content: string
}
```
- `user` role → plain text bubble (right-aligned, blue)
- `assistant` role → DOMPurify-sanitized HTML (left-aligned, dark card)

**DOMPurify config:**
```typescript
DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['div','span','p','strong','em','ul','ol','li',
                 'table','tr','td','th','thead','tbody',
                 'h1','h2','h3','h4','code','pre','br'],
  ALLOWED_ATTR: ['style', 'class']
})
```

### Session storage
```typescript
// lib/chatSession.ts (NEW)
const SESSION_KEY = 'job_prep_chat_session_id';

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
```

---

## UI States

| State | Trigger | UI |
|-------|---------|-----|
| `loading_history` | Component mounts | Skeleton shimmer |
| `empty` | No messages for company+session | 6 prompt chips |
| `has_messages` | History loaded or sent | Message list |
| `sending` | Awaiting AI | Typing indicator (3 dots) |
| `error` | API failed | Inline error + retry |

**Prompt chips (6):**
1. 🎯 What does the interview loop look like?
2. 💻 How should I prep for the coding rounds?
3. 🏗️ What's the system design round like?
4. 💰 What's the total comp for senior levels?
5. 🌍 What's the engineering culture like?
6. 📈 How does the promo process work?

---

## Files to Change

| File | Action | What changes |
|------|--------|-------------|
| `backend/app/research/chat_service.py` | NEW | ensure table, load history, call Claude, save messages |
| `backend/app/research/router.py` | MODIFY | +3 endpoints |
| `frontend/src/lib/api.ts` | MODIFY | +chatCompany(), +getChatHistory(), +clearChatHistory() |
| `frontend/src/lib/chatSession.ts` | NEW | getOrCreateSessionId() |
| `frontend/src/components/research/CompanyChat.tsx` | NEW | full chat panel |
| `frontend/src/components/research/ChatMessage.tsx` | NEW | HTML-rendering message bubble |
| `frontend/src/app/research/page.tsx` | MODIFY | PanelGroup wrapper + CompanyChat in right panel |
| `frontend/package.json` | MODIFY | +react-resizable-panels, +dompurify, +@types/dompurify |

---

## Implementation Phases

### Phase 1 — Backend (DB + endpoints)
- Create `chat_service.py`
- Add `_ensure_table()` for `company_chat_messages`
- Add 3 endpoints to `router.py`

### Phase 2 — Frontend lib
- Add API functions to `lib/api.ts`
- Create `lib/chatSession.ts`
- Install `dompurify`, `@types/dompurify`, `react-resizable-panels`

### Phase 3 — Frontend components
- Create `CompanyChat.tsx` and `ChatMessage.tsx`
- Handle all 5 UI states

### Phase 4 — Research page integration
- Wrap result in `PanelGroup`
- Render `CompanyChat` in right panel
- Rebuild Docker image + smoke test

---

## Constraints

- **Zero breaking changes** — all existing routes, the research table, MarkdownRenderer, and search flow are untouched
- **Security** — DOMPurify sanitizes all assistant HTML before rendering; no script tags or event handlers pass through
- **History cap** — last 20 messages sent to Claude to control token usage and latency
- **No auth required** — session_id UUID in localStorage is sufficient for this use case
