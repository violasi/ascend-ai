"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getChatHistory, chatCompany, clearChatHistory, getLatestChatSession, type ChatMessage as ChatMessageType } from "@/lib/api";
import { getOrCreateSessionId, saveSessionId } from "@/lib/chatSession";
import { ChatMessage } from "./ChatMessage";

interface Props {
  companyKey: string;
  companyName: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const PROMPT_CHIPS = [
  { icon: "🎯", text: "What does the interview loop look like?" },
  { icon: "💻", text: "How should I prep for the coding rounds?" },
  { icon: "🏗️", text: "What's the system design round like?" },
  { icon: "💰", text: "What's the total comp for senior levels?" },
  { icon: "🌍", text: "What's the engineering culture like?" },
  { icon: "📈", text: "How does the promo process work?" },
];

type UIState = "loading_history" | "empty" | "has_messages" | "sending" | "error";

export function CompanyChat({ companyKey, companyName, expanded, onToggleExpand }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [uiState, setUiState] = useState<UIState>("loading_history");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialise session id client-side only
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Load history whenever companyKey or sessionId changes.
  // If local session has no messages, check DB for a more recent session to adopt.
  useEffect(() => {
    if (!sessionId || !companyKey) return;
    setUiState("loading_history");
    setMessages([]);
    setError(null);

    getChatHistory(companyKey, sessionId)
      .then(async ({ messages: msgs }) => {
        if (msgs.length > 0) {
          setMessages(msgs);
          setUiState("has_messages");
          return;
        }
        // No history for local session — check if another session exists in DB
        const { session_id: latestId } = await getLatestChatSession(companyKey);
        if (latestId && latestId !== sessionId) {
          // Adopt the existing session so history is visible across origins
          saveSessionId(latestId);
          setSessionId(latestId);
          // History will re-fetch via the sessionId state change
        } else {
          setUiState("empty");
        }
      })
      .catch(() => {
        setUiState("empty");
      });
  }, [companyKey, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || !sessionId) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessageType = { id: Date.now(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setUiState("sending");

    try {
      const { reply } = await chatCompany(companyKey, sessionId, msg);
      const assistantMsg: ChatMessageType = { id: Date.now() + 1, role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      setUiState("has_messages");
    } catch (e) {
      setError(String(e));
      setUiState("error");
    }
  }, [companyKey, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    try {
      await clearChatHistory(companyKey, sessionId);
      setMessages([]);
      setUiState("empty");
      setError(null);
    } catch {
      // ignore clear errors
    }
  };

  const borderColor = "rgba(255,255,255,0.06)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface)",
        borderLeft: `1px solid ${borderColor}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          background: "var(--elevated)",
        }}
      >
        <div style={{ fontSize: 16 }}>💬</div>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Ask about {companyName}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
            {uiState === "loading_history"
              ? "Loading…"
              : messages.length === 0
              ? "Start a conversation"
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} · saved`}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            title="Clear history"
            style={{
              background: "transparent",
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              padding: "3px 8px",
              fontSize: 11,
              color: "var(--text-3)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            🗑 Clear
          </button>
        )}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            title={expanded ? "Restore split view" : "Expand chat"}
            style={{
              background: "transparent",
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              padding: "3px 8px",
              fontSize: 11,
              color: "var(--text-3)",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {expanded ? "↙ Minimize" : "↗ Expand"}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 14px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Loading skeleton */}
        {uiState === "loading_history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[70, 85, 55, 90, 65].map((w, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  height: 12,
                  borderRadius: 6,
                  width: `${w}%`,
                  alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state — prompt chips */}
        {uiState === "empty" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "16px 8px",
            }}
          >
            <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
              Ask anything about {companyName}&apos;s<br />interview process, culture, or compensation
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {PROMPT_CHIPS.map(({ icon, text }) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  style={{
                    background: "var(--elevated)",
                    border: `1px solid ${borderColor}`,
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 12,
                    color: "var(--text-2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-light)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-light)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
                  }}
                >
                  <span>{icon}</span>
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {(uiState === "has_messages" || uiState === "sending" || uiState === "error") &&
          messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}

        {/* Typing indicator */}
        {uiState === "sending" && (
          <div className="flex gap-2 items-start">
            <div
              style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "var(--elevated)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0, marginTop: 2,
              }}
            >
              ✦
            </div>
            <div
              style={{
                background: "var(--elevated)", border: "1px solid var(--border)",
                borderRadius: "3px 12px 12px 12px", padding: "12px 16px",
                display: "flex", gap: 4, alignItems: "center",
              }}
            >
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--text-3)",
                    animation: "chatDot 1.2s ease-in-out infinite",
                    animationDelay: `${delay}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {uiState === "error" && error && (
          <div
            style={{
              background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)",
              borderRadius: 8, padding: "10px 14px", fontSize: 12,
              color: "var(--rose)", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span>Failed to get response. Try again.</span>
            <button
              onClick={() => { setUiState("has_messages"); setError(null); }}
              style={{ background: "transparent", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: `1px solid ${borderColor}`,
          flexShrink: 0,
          background: "var(--elevated)",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${companyName}…`}
            disabled={uiState === "sending" || uiState === "loading_history"}
            rows={1}
            style={{
              flex: 1,
              background: "var(--surface)",
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--text-1)",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
              minHeight: 38,
              maxHeight: 120,
              overflowY: "auto",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = borderColor)}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || uiState === "sending" || uiState === "loading_history"}
            style={{
              background: input.trim() && uiState !== "sending" ? "var(--accent)" : "var(--elevated)",
              border: `1px solid ${input.trim() && uiState !== "sending" ? "var(--accent)" : borderColor}`,
              borderRadius: 10,
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && uiState !== "sending" ? "pointer" : "not-allowed",
              fontSize: 15, flexShrink: 0,
              color: input.trim() && uiState !== "sending" ? "#fff" : "var(--text-3)",
              transition: "all 0.15s",
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ fontSize: 10, color: "var(--text-3)", margin: "5px 0 0", textAlign: "center" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .chat-assistant-content table {
          width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;
        }
        .chat-assistant-content td, .chat-assistant-content th {
          padding: 6px 10px; border: 1px solid rgba(255,255,255,0.06); text-align: left;
        }
        .chat-assistant-content th { background: var(--bg); font-weight: 600; font-size: 11px; }
        .chat-assistant-content p { margin: 6px 0; }
        .chat-assistant-content ul, .chat-assistant-content ol { padding-left: 18px; margin: 6px 0; }
        .chat-assistant-content li { margin: 2px 0; }
        .chat-assistant-content code { background: var(--bg); border-radius: 4px; padding: 1px 5px; font-size: 11px; font-family: monospace; }
        .chat-assistant-content pre { background: var(--bg); border-radius: 6px; padding: 12px; overflow-x: auto; font-size: 12px; margin: 8px 0; border: 1px solid rgba(255,255,255,0.06); }
        .chat-assistant-content pre code { background: transparent; padding: 0; font-size: 12px; }
        .chat-assistant-content strong { color: var(--text-1); }
        .chat-assistant-content h1, .chat-assistant-content h2, .chat-assistant-content h3,
        .chat-assistant-content h4, .chat-assistant-content h5, .chat-assistant-content h6 {
          color: var(--text-1); font-weight: 600; margin: 10px 0 4px;
        }
        .chat-assistant-content h1 { font-size: 15px; }
        .chat-assistant-content h2 { font-size: 14px; }
        .chat-assistant-content h3 { font-size: 13px; }
        .chat-assistant-content h4, .chat-assistant-content h5, .chat-assistant-content h6 { font-size: 12px; }
        .chat-assistant-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 10px 0; }
        .chat-assistant-content blockquote { border-left: 3px solid var(--accent); padding: 6px 12px; margin: 8px 0; color: var(--text-2); background: rgba(99,102,241,0.05); border-radius: 0 6px 6px 0; }
        .chat-assistant-content a { color: var(--accent-light); text-decoration: underline; }
      `}</style>
    </div>
  );
}
