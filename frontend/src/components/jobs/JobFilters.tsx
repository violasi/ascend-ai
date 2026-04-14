"use client";

import { useCallback } from "react";
import type { JobFilters } from "@/lib/api";
import type { Company } from "@/lib/types";

const LEVELS = ["L3", "L4", "L5", "L6", "L7+"];
const LEVEL_COLORS: Record<string, string> = {
  "L3":  "text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10",
  "L4":  "text-[#60A5FA] border-[#60A5FA]/30 bg-[#60A5FA]/10",
  "L5":  "text-[#818CF8] border-[#818CF8]/30 bg-[#818CF8]/10",
  "L6":  "text-[#C084FC] border-[#C084FC]/30 bg-[#C084FC]/10",
  "L7+": "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
};

interface JobFiltersProps {
  filters: JobFilters;
  companies: Company[];
  onChange: (filters: JobFilters) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest font-mono">{title}</p>
      {children}
    </div>
  );
}

export function JobFiltersPanel({ filters, companies, onChange }: JobFiltersProps) {
  const update = useCallback(
    (patch: Partial<JobFilters>) => onChange({ ...filters, page: 1, ...patch }),
    [filters, onChange]
  );

  const hasActive = !!(filters.q || filters.level || filters.remote || filters.company || filters.tier);

  return (
    <aside className="space-y-6">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search roles..."
          value={filters.q || ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          className="input pl-9"
        />
      </div>

      {/* Company Type */}
      <Section title="Company Type">
        <div className="space-y-0.5">
          {[
            { value: undefined, label: "All Companies" },
            { value: "faang_plus", label: "FAANG++ & Big Tech" },
            { value: "ai_startup", label: "AI Startups" },
            { value: "yc_unicorn", label: "YC & Unicorns" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => update({ tier: opt.value })}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 ${
                filters.tier === opt.value
                  ? "bg-[var(--accent)]/15 text-[var(--accent-light)]"
                  : "text-[var(--text-2)] hover:bg-[var(--elevated)] hover:text-[var(--text-1)]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${filters.tier === opt.value ? "bg-[var(--accent-light)]" : "bg-[var(--border)]"}`} />
              {opt.label}
              {filters.tier === opt.value && (
                <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Level */}
      <Section title="Level">
        <div className="grid grid-cols-3 gap-1">
          {LEVELS.map((lvl) => {
            const active = filters.level === lvl;
            return (
              <button
                key={lvl}
                onClick={() => update({ level: active ? undefined : lvl })}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold text-center transition-all border font-mono ${
                  active
                    ? LEVEL_COLORS[lvl]
                    : "border-[var(--border)] text-[var(--text-3)] hover:border-[var(--border-hover)] hover:text-[var(--text-2)]"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Work Style */}
      <Section title="Work Style">
        <button
          onClick={() => update({ remote: filters.remote ? undefined : true })}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 ${
            filters.remote
              ? "bg-[#10B981]/10 text-[#10B981]"
              : "text-[var(--text-2)] hover:bg-[var(--elevated)] hover:text-[var(--text-1)]"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${filters.remote ? "bg-[#10B981]" : "bg-[var(--border)]"}`} />
          Remote Only
          {filters.remote && (
            <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </Section>

      {/* Company */}
      <Section title="Company">
        <select
          value={filters.company || ""}
          onChange={(e) => update({ company: e.target.value ? Number(e.target.value) : undefined })}
          className="input cursor-pointer"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.open_roles})
            </option>
          ))}
        </select>
      </Section>

      {/* Clear */}
      {hasActive && (
        <button
          onClick={() => onChange({ page: 1, limit: filters.limit })}
          className="w-full py-2 text-[11px] font-semibold text-[var(--rose)] border border-[var(--rose)]/20 hover:border-[var(--rose)]/40 rounded-lg hover:bg-[var(--rose)]/5 transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      )}
    </aside>
  );
}
