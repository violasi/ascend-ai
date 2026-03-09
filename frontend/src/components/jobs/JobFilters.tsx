"use client";

import { useCallback } from "react";
import type { JobFilters } from "@/lib/api";
import type { Company } from "@/lib/types";

const LEVELS = ["L3", "L4", "L5", "L6", "L7+"];

interface JobFiltersProps {
  filters: JobFilters;
  companies: Company[];
  onChange: (filters: JobFilters) => void;
}

export function JobFiltersPanel({ filters, companies, onChange }: JobFiltersProps) {
  const update = useCallback(
    (patch: Partial<JobFilters>) => onChange({ ...filters, page: 1, ...patch }),
    [filters, onChange]
  );

  return (
    <aside className="w-full space-y-6">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="e.g. backend engineer, ML..."
          value={filters.q || ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Tier */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Company Type
        </label>
        <div className="space-y-1">
          {[
            { value: undefined, label: "All Companies" },
            { value: "faang_plus", label: "FAANG++ & Big Tech" },
            { value: "ai_startup", label: "AI Startups" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => update({ tier: opt.value })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.tier === opt.value
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Level
        </label>
        <div className="space-y-1">
          <button
            onClick={() => update({ level: undefined })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !filters.level ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Levels
          </button>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => update({ level: lvl })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.level === lvl ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Remote */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.remote === true}
            onChange={(e) => update({ remote: e.target.checked ? true : undefined })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-700">Remote only 🌍</span>
        </label>
      </div>

      {/* Company */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Company
        </label>
        <select
          value={filters.company || ""}
          onChange={(e) => update({ company: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {(filters.q || filters.level || filters.remote || filters.company || filters.tier) && (
        <button
          onClick={() => onChange({ page: 1, limit: filters.limit })}
          className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Clear filters ✕
        </button>
      )}
    </aside>
  );
}
