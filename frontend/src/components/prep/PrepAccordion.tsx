"use client";

import { useState } from "react";
import type { ContentType, PrepPlan } from "@/lib/types";
import { getPrep } from "@/lib/api";
import { CONTENT_TYPE_LABELS } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

const TABS: ContentType[] = ["coding", "system_design", "behavioral", "company_tips", "edge_tech"];

interface PrepAccordionProps {
  jobId: number;
}

export function PrepAccordion({ jobId }: PrepAccordionProps) {
  const [activeTab, setActiveTab] = useState<ContentType | null>(null);
  const [plans, setPlans] = useState<Partial<Record<ContentType, PrepPlan>>>({});
  const [loading, setLoading] = useState<Partial<Record<ContentType, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<ContentType, string>>>({});

  async function handleTabClick(type: ContentType) {
    if (activeTab === type) {
      setActiveTab(null);
      return;
    }
    setActiveTab(type);
    if (plans[type]) return;

    setLoading((prev) => ({ ...prev, [type]: true }));
    setErrors((prev) => ({ ...prev, [type]: undefined }));
    try {
      const plan = await getPrep(jobId, type);
      setPlans((prev) => ({ ...prev, [type]: plan }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [type]: String(e) }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">AI Prep Plan</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Click a tab to generate personalized preparation with Claude Opus
        </p>
      </div>

      <div className="flex border-b border-slate-100 overflow-x-auto">
        {TABS.map((type) => {
          const { emoji, label } = CONTENT_TYPE_LABELS[type];
          return (
            <button
              key={type}
              onClick={() => handleTabClick(type)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === type
                  ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {plans[type] && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" title="Cached" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div className="p-6">
          {loading[activeTab] && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Generating with Claude Opus...</p>
              <p className="text-xs text-slate-400">This may take 30–60 seconds. Result will be cached.</p>
            </div>
          )}
          {errors[activeTab] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {errors[activeTab]}
            </div>
          )}
          {plans[activeTab] && !loading[activeTab] && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                <span>🤖 {plans[activeTab]!.model}</span>
                <span>·</span>
                <span>{plans[activeTab]!.cached ? "Served from cache" : "Freshly generated"}</span>
              </div>
              <MarkdownRenderer content={plans[activeTab]!.content} />
            </div>
          )}
          {!loading[activeTab] && !errors[activeTab] && !plans[activeTab] && (
            <p className="text-slate-400 text-sm text-center py-8">Select a tab above to generate prep content.</p>
          )}
        </div>
      )}

      {!activeTab && (
        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">👆 Click a preparation type above to get started</p>
        </div>
      )}
    </div>
  );
}
