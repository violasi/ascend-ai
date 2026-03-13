"use client";

import { useEffect, useRef } from "react";

interface Props {
  role: "user" | "assistant";
  content: string;
}

// Sanitize HTML using DOMPurify — browser-only, safe in "use client" component
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  // Dynamically import DOMPurify to keep SSR safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DOMPurify = (window as any).__dompurify__;
  if (!DOMPurify) return html; // fallback before hydration
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "div", "span", "p", "strong", "em", "ul", "ol", "li",
      "table", "tr", "td", "th", "thead", "tbody",
      "h1", "h2", "h3", "h4", "code", "pre", "br", "small",
    ],
    ALLOWED_ATTR: ["style", "class"],
  });
}

export function ChatMessage({ role, content }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role !== "assistant" || !ref.current) return;
    Promise.all([import("dompurify"), import("marked")]).then(([purifyMod, markedMod]) => {
      const DOMPurify = purifyMod.default;
      const { marked } = markedMod;
      if (ref.current) {
        const html = marked(content, { breaks: true }) as string;
        ref.current.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            "div", "span", "p", "strong", "em", "ul", "ol", "li",
            "table", "tr", "td", "th", "thead", "tbody",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "code", "pre", "blockquote", "hr", "br", "small", "a",
          ],
          ALLOWED_ATTR: ["style", "class", "href", "target"],
        });
      }
    });
  }, [role, content]);

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          style={{
            background: "var(--accent)",
            borderRadius: "12px 12px 3px 12px",
            padding: "8px 14px",
            maxWidth: "80%",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#fff",
            wordBreak: "break-word",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      {/* Bot avatar */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        ✦
      </div>
      {/* Content */}
      <div
        ref={ref}
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--border)",
          borderRadius: "3px 12px 12px 12px",
          padding: "10px 14px",
          maxWidth: "88%",
          fontSize: "13px",
          lineHeight: "1.65",
          color: "var(--text-2)",
          wordBreak: "break-word",
        }}
        className="chat-assistant-content"
      >
        {/* Content injected via useEffect after DOMPurify loads */}
        <span style={{ color: "var(--text-3)", fontSize: 11 }}>Loading…</span>
      </div>
    </div>
  );
}
