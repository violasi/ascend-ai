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
  └── ResearchPage (MODIFIED) — "use client"
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
  └── maxDuration = 120s already set — sufficient for chat responses (200-400 words << full research)

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
1. `ResearchPage` receives research result (now includes `company_key` in response — see API note below)
2. Mounts `CompanyChat` with `companyKey={result.company_key}`
3. `CompanyChat` reads `session_id` from localStorage (creates UUID if missing)
4. `GET /api/research/chat/{company_key}?session_id=...` — called with `noCache()`
5. Backend queries `company_chat_messages` WHERE `company_key + session_id`
6. Returns messages → render list, or show prompt chips if empty

### On Message Send
1. User types → hits send
2. Optimistic UI: user message appears immediately
3. `POST /api/research/chat` with `{ company_key, session_id, message }` — called with `noCache()`
4. Backend loads last 20 messages from DB
5. Fetches `company_research.content` for this `company_key` (grounding context)
6. Calls Claude with `system=research_report` + `messages=[history + new]`
7. Saves both user message and assistant reply to DB
8. Returns `{ reply }` → render `ChatMessage`

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
- `_ensure_table()` called **once at app startup** in the FastAPI lifespan handler (not per-request) to avoid Postgres lock contention on the high-frequency chat path
- History window sent to Claude capped at **last 20 messages** for context/latency

---

## API Endpoints

### researchCompany() — EXISTING, MODIFIED response type
The backend `service.py` already returns `company_key` in the row dict. The TypeScript type in `lib/api.ts` must be updated to include it so `ResearchPage` can pass it to `CompanyChat` without any frontend normalization.

```typescript
// Updated return type for researchCompany()
interface ResearchResult {
  company_key: string      // ADD THIS — already returned by backend
  company_name: string
  content: string
  cached: boolean
  generated_at: string
}
```

### POST /api/research/chat
Send a message. Returns AI reply. Saves both messages to DB.

```
Request:  { company_key: str, session_id: str (UUID format), message: str }
Response: { reply: str }
Errors:   400 missing fields / message > 2000 chars / session_id not valid UUID
          404 company_key not found in company_research (no context to ground on)
          500 Claude API failure
```

**Backend validation:** `session_id` must match UUID v4 format — validated with `uuid.UUID(session_id, version=4)` in Pydantic model, raising 400 on failure.

### GET /api/research/chat/{company_key}
Load full chat history for a company × session. Called with `noCache()`.

```
Query:    ?session_id=uuid
Response: { messages: [{role, content, id}], company_key: str }
```

**Backend validation:** `session_id` validated as UUID format.

### DELETE /api/research/chat/{company_key}
Clear history (triggered by "🗑 Clear" button). Uses query param — no request body.

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

### CompanyChat.tsx (NEW) — must be `"use client"`
```typescript
interface Props {
  companyKey: string      // e.g. "stripe" — from researchCompany() response
  companyName: string     // e.g. "Stripe"
}
```
Manages: `messages[]`, `loading`, `sending`, `error` state.
On mount: loads history from API with `noCache()`.
On send: optimistic update → POST → append reply.
On clear: DELETE → reset messages.

**Mobile:** On viewports < 768px, render as stacked panels (research on top, chat below, fixed height 400px) instead of side-by-side. `react-resizable-panels` supports `direction="vertical"` for this. Add a `useMediaQuery('(max-width: 768px)')` hook to switch direction.

### ChatMessage.tsx (NEW) — must be `"use client"` (DOMPurify is browser-only)
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
  // Note: 'style' is intentionally permitted to allow Claude's inline-styled
  // flow diagrams and callout blocks. The content field is exclusively populated
  // by Claude API output — no user-supplied or third-party HTML ever enters this
  // path, so trust is delegated to Claude API output integrity.
  // Script execution and event handlers are blocked by DOMPurify regardless.
  // CSS-based resource loading (background-image: url) is mitigated by the
  // app's Content-Security-Policy which should set img-src 'self' data: and
  // connect-src 'self' to block external URL leakage from inline styles.
})
```

### lib/chatSession.ts (NEW) — browser-only, called only from `"use client"` components
```typescript
const SESSION_KEY = 'job_prep_chat_session_id';

export function getOrCreateSessionId(): string {
  // Guard: localStorage is undefined in SSR/Node environments
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
```

### lib/api.ts additions — all use noCache()

The existing `noCache()` helper (line 99–101 of `lib/api.ts`) spreads its argument into a new object:
```typescript
function noCache(options?: RequestInit): RequestInit {
  return { ...options, next: { revalidate: 0 } } as RequestInit;
}
```
Spreading `options` first means `method`, `body`, and other fields are preserved correctly. The `next: { revalidate: 0 }` override is safe to apply alongside any method.

```typescript
export function getChatHistory(companyKey: string, sessionId: string) {
  return apiFetch(`/api/research/chat/${companyKey}?session_id=${sessionId}`, noCache());
}

export function chatCompany(companyKey: string, sessionId: string, message: string) {
  return apiFetch('/api/research/chat', noCache({
    method: 'POST',
    body: JSON.stringify({ company_key: companyKey, session_id: sessionId, message }),
  }));
}

export function clearChatHistory(companyKey: string, sessionId: string) {
  return apiFetch(`/api/research/chat/${companyKey}?session_id=${sessionId}`, noCache({ method: 'DELETE' }));
}
```

**Note:** `getOrCreateSessionId()` returns `''` when called server-side (SSR guard). All three functions above must only be called when `sessionId` is truthy — `CompanyChat.tsx` must guard: `if (!sessionId) return` before any API call.

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
| `backend/app/research/chat_service.py` | NEW | ensure table (startup only), load history, call Claude, save messages |
| `backend/app/research/router.py` | MODIFY | +3 endpoints; session_id UUID validation via Pydantic |
| `backend/app/main.py` | MODIFY | call `ensure_chat_table()` in lifespan handler |
| `frontend/src/lib/api.ts` | MODIFY | +company_key to ResearchResult type; +chatCompany(), +getChatHistory(), +clearChatHistory() (all noCache) |
| `frontend/src/lib/chatSession.ts` | NEW | getOrCreateSessionId() with SSR guard |
| `frontend/src/components/research/CompanyChat.tsx` | NEW | full chat panel; "use client"; mobile direction switch |
| `frontend/src/components/research/ChatMessage.tsx` | NEW | HTML-rendering message bubble; "use client" (DOMPurify) |
| `frontend/src/app/research/page.tsx` | MODIFY | PanelGroup wrapper + CompanyChat in right panel; pass company_key from result |
| `frontend/package.json` | MODIFY | +react-resizable-panels, +dompurify, +@types/dompurify |

---

## Implementation Phases

### Phase 1 — Backend (DB + endpoints)
- Create `chat_service.py` with `ensure_chat_table()` (called at startup, not per-request)
- Add Pydantic model with UUID-validated `session_id` field
- Add 3 endpoints to `router.py`
- Call `ensure_chat_table()` in `main.py` lifespan handler

### Phase 2 — Frontend lib
- Add `company_key` to `ResearchResult` type in `lib/api.ts`
- Add `chatCompany()`, `getChatHistory()`, `clearChatHistory()` (all with `noCache()`)
- Create `lib/chatSession.ts` with SSR guard
- Install `dompurify`, `@types/dompurify`, `react-resizable-panels`

### Phase 3 — Frontend components
- Create `CompanyChat.tsx` (`"use client"`) and `ChatMessage.tsx` (`"use client"`)
- Handle all 5 UI states
- Mobile: vertical layout < 768px

### Phase 4 — Research page integration
- Wrap result in `PanelGroup` passing `companyKey={result.company_key}`
- Render `CompanyChat` in right panel
- Rebuild Docker image + smoke test end-to-end

---

## Constraints

- **Zero breaking changes** — all existing routes, the research table, MarkdownRenderer, and search flow are untouched
- **Security** — DOMPurify sanitizes all assistant HTML; script tags and event handlers blocked. `style` attribute permitted for visual richness (CSS exfiltration accepted tradeoff)
- **Session ID** — UUID v4 validated server-side on all three endpoints
- **History cap** — last 20 messages sent to Claude to control token usage and latency
- **SSR safety** — `localStorage` access guarded by `typeof window !== 'undefined'`; DOMPurify components marked `"use client"`
- **No auth required** — session_id UUID in localStorage is sufficient for this use case
