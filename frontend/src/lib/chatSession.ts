const SESSION_KEY = "job_prep_chat_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Persist a session ID adopted from the DB (e.g. when switching origins). */
export function saveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, id);
}
