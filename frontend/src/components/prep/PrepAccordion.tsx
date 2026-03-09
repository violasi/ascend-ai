"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { PrepPlan, ContentType } from "@/lib/types";
import { getPrep, getPersonalizedPrep, markPrepViewed } from "@/lib/api";
import { CONTENT_TABS, type ContentTypeKey } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

const RESUME_STORAGE_KEY = "ascend_resume_text";
const ANALYSIS_ID_KEY = "ascend_analysis_id";

interface PrepAccordionProps {
  jobId: number;
}

export function PrepAccordion({ jobId }: PrepAccordionProps) {
  const searchParams = useSearchParams();
  const isPersonalized = searchParams.get("personalized") === "1";
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [viewedTypes, setViewedTypes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<ContentTypeKey | null>(null);
  const [plans, setPlans] = useState<Partial<Record<ContentTypeKey, PrepPlan>>>({});
  const [loading, setLoading] = useState<Partial<Record<ContentTypeKey, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<ContentTypeKey, string>>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isPersonalized) {
        const saved = localStorage.getItem(RESUME_STORAGE_KEY);
        setResumeText(saved);
      }
      const id = localStorage.getItem(ANALYSIS_ID_KEY);
      if (id) setAnalysisId(Number(id));
    }
  }, [isPersonalized]);

  async function handleTabClick(type: ContentTypeKey) {
    if (activeTab === type) {
      setActiveTab(null);
      return;
    }
    setActiveTab(type);
    if (plans[type]) return;
    setLoading((p) => ({ ...p, [type]: true }));
    setErrors((p) => ({ ...p, [type]: undefined }));
    try {
      let plan: PrepPlan;
      if (isPersonalized && resumeText) {
        plan = await getPersonalizedPrep(jobId, type, resumeText);
      } else {
        plan = await getPrep(jobId, type);
      }
      setPlans((p) => ({ ...p, [type]: plan }));
      // Track progress
      if (analysisId) {
        setViewedTypes((prev) => new Set([...prev, type]));
        markPrepViewed(analysisId, jobId, type as ContentType).catch(() => {});
      }
    } catch (e) {
      setErrors((p) => ({ ...p, [type]: String(e) }));
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPersonalized
              ? "bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "bg-gradient-to-br from-[var(--accent)] to-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          }`}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" className="text-white" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-1)] text-sm">
              {isPersonalized ? "✦ Personalized AI Prep" : "AI Interview Prep"}
            </h2>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
              {isPersonalized
                ? "Tailored to your resume · Claude Opus · Never cached"
                : "Claude Opus · Cached after first load"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {viewedTypes.size > 0 && (
              <span className="badge border text-[var(--text-3)] bg-[var(--elevated)] border-[var(--border)]">
                {viewedTypes.size}/5 done
              </span>
            )}
            {isPersonalized && (
              <span className="badge border text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20">
                ✓ Resume-aware
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-5 border-b border-[var(--border)] bg-[var(--surface)]">
        {CONTENT_TABS.map((tab) => {
          const isActive = activeTab === tab.type;
          const isDone = !!plans[tab.type as ContentTypeKey];
          const isLoading = !!loading[tab.type as ContentTypeKey];
          return (
            <button
              key={tab.type}
              onClick={() => handleTabClick(tab.type as ContentTypeKey)}
              className={`relative flex flex-col items-center justify-center gap-1 py-4 px-2 text-center transition-all border-b-2 ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-transparent hover:bg-[var(--elevated)]"
              }`}
            >
              <span className="text-lg">{isLoading ? "⌛" : tab.emoji}</span>
              <span
                className={`text-[10px] font-semibold leading-tight ${isActive ? "text-[var(--accent-light)]" : "text-[var(--text-3)]"}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tab.label}
              </span>
              {isDone && !isLoading && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--green)]" title="Ready" />
              )}
              {!isDone && !isLoading && viewedTypes.has(tab.type) && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" title="Viewed" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      {activeTab && (
        <div className="px-6 py-2.5 bg-[var(--elevated)] border-b border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-3)]">
            {CONTENT_TABS.find((t) => t.type === activeTab)?.desc}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[220px]">
        {!activeTab && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="flex gap-3 mb-1">
              {CONTENT_TABS.map((t) => (
                <span key={t.type} className="text-2xl opacity-40">{t.emoji}</span>
              ))}
            </div>
            <p className="text-sm font-medium text-[var(--text-2)]">
              {isPersonalized ? "Select a tab for your personalized prep plan" : "Select a tab to generate your prep plan"}
            </p>
            <p className="text-xs text-[var(--text-3)]" style={{ fontFamily: "var(--font-mono)" }}>
              {isPersonalized ? "Personalized to your resume · ~45–90s" : "First load ~30–60s · Cached after"}
            </p>
          </div>
        )}

        {activeTab && loading[activeTab] && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-1)]">
                {isPersonalized ? "Generating personalized plan…" : "Generating with Claude Opus…"}
              </p>
              <p className="text-xs text-[var(--text-3)] mt-1">
                {isPersonalized ? "Analyzing your resume against this role…" : "Building a targeted plan for this role…"}
              </p>
            </div>
          </div>
        )}

        {activeTab && errors[activeTab] && (
          <div className="m-6 p-4 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/20">
            <p className="text-sm font-medium text-[var(--rose)] mb-1">Generation failed</p>
            <p className="text-xs text-[var(--rose)]/70">{errors[activeTab]}</p>
          </div>
        )}

        {activeTab && plans[activeTab] && !loading[activeTab] && (
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[var(--border)]">
              {plans[activeTab]!.personalized ? (
                <span className="badge border text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20">
                  ✦ Personalized to your resume
                </span>
              ) : (
                <span className={`badge border ${plans[activeTab]!.cached
                  ? "text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/20"
                  : "text-[var(--accent-light)] bg-[var(--accent)]/10 border-[var(--accent)]/20"
                }`}>
                  {plans[activeTab]!.cached ? "✓ From cache" : "✨ Just generated"}
                </span>
              )}
              <span className="badge border text-[var(--text-3)] bg-[var(--elevated)] border-[var(--border)]" style={{ fontFamily: "var(--font-mono)" }}>
                {plans[activeTab]!.model}
              </span>
            </div>
            <MarkdownRenderer content={plans[activeTab]!.content} />
          </div>
        )}
      </div>
    </div>
  );
}
