"use client";

import { useState, useEffect, useCallback } from "react";
import { getJobs, getCompanies, getProfileData, markApplied, unmarkApplied, type JobFilters } from "@/lib/api";
import type { Job, Company } from "@/lib/types";
import { JobGrid } from "@/components/jobs/JobGrid";
import { JobFiltersPanel } from "@/components/jobs/JobFilters";
import { YCStartupsSection } from "@/components/jobs/YCStartupsSection";

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 backdrop-blur-sm">
      <span className="text-[var(--text-1)] font-bold text-sm tracking-tight">{value}</span>
      <span className="text-[var(--text-3)] text-[11px] font-medium">{label}</span>
    </div>
  );
}

const ANALYSIS_ID_KEY = "ascend_analysis_id";

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 21 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [prepProgress, setPrepProgress] = useState<Record<string, string[]>>({});

  const handleViewYCAll = useCallback(() => {
    setFilters((f) => ({ ...f, tier: "yc_unicorn", page: 1 }));
    // Scroll down to the main results section
    setTimeout(() => {
      document.getElementById("job-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleAppliedChange = useCallback((jobId: number, applied: boolean) => {
    setAppliedJobIds((prev) => {
      const next = new Set(prev);
      if (applied) next.add(jobId); else next.delete(jobId);
      return next;
    });
  }, []);

  const loadJobs = useCallback(async (f: JobFilters) => {
    setLoading(true);
    try {
      const data = await getJobs(f);
      setJobs(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error("Failed to load jobs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCompanies()
      .then((data) => setCompanies([...data.faang_plus, ...data.ai_startup, ...(data.yc_unicorn ?? [])]))
      .catch(console.error);
    // Load profile data if a previous session exists
    const id = localStorage.getItem(ANALYSIS_ID_KEY);
    if (id) {
      const aid = Number(id);
      setAnalysisId(aid);
      getProfileData(aid)
        .then((data) => {
          setAppliedJobIds(new Set(data.applied_job_ids));
          setPrepProgress(data.prep_progress);
        })
        .catch(() => {}); // silently ignore if session expired
    }
  }, []);

  useEffect(() => { loadJobs(filters); }, [filters, loadJobs]);

  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--bg)] pt-14 pb-20">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.2),transparent)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-2)] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] live-dot" />
              Live job listings · Refreshed every 6 hours
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5">
              <span className="gradient-text">Rise to the top</span>
              <span className="text-[var(--text-1)]"> of every</span>
              <br />
              <span className="text-[var(--text-1)]">FAANG+ and AI Startup interview.</span>
            </h1>

            <p className="text-[var(--text-2)] text-lg leading-relaxed mb-8 max-w-2xl">
              Ascend surfaces live SWE roles from 31 elite companies and generates hyper-personalized prep plans with Claude Opus — from DSA roadmaps to insider company tips and top-of-band tactics.
            </p>

            <div className="flex flex-wrap gap-2">
              {total > 0 && <StatPill value={total.toLocaleString()} label="SWE roles" />}
              <StatPill value="31" label="companies" />
              <StatPill value="5" label="prep types per job" />
              <StatPill value="Claude Opus" label="AI engine" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* YC & Unicorn featured section */}
        <div className="pt-8 -mt-5">
          <YCStartupsSection onViewAll={handleViewYCAll} />
        </div>

        {/* Result bar */}
        <div id="job-results" className="flex items-center justify-between mb-6 card-static px-5 py-3">
          <div className="flex items-center gap-3">
            {!loading && (
              <p className="text-sm text-[var(--text-2)]">
                <span className="font-bold text-[var(--text-1)] font-mono">{total.toLocaleString()}</span>
                <span className="text-[var(--text-3)]"> open roles</span>
                {filters.q && <span className="text-[var(--accent-light)] ml-1">· "{filters.q}"</span>}
              </p>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center gap-2 text-xs font-medium text-[var(--text-2)] hover:text-[var(--text-1)] btn-ghost py-1.5 px-3"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(filters.q || filters.level || filters.remote || filters.company || filters.tier) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className={`w-52 flex-shrink-0 sticky top-[calc(3.5rem+1.5rem)] ${sidebarOpen ? "block" : "hidden"} lg:block`}>
            <div className="card-static p-4">
              <JobFiltersPanel filters={filters} companies={companies} onChange={setFilters} />
            </div>
          </div>

          {/* Grid + pagination */}
          <div className="flex-1 min-w-0">
            <JobGrid
              jobs={jobs}
              loading={loading}
              analysisId={analysisId}
              appliedJobIds={appliedJobIds}
              prepProgress={prepProgress}
              onAppliedChange={handleAppliedChange}
            />

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed px-4 text-xs"
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = i + 1;
                    const cur = filters.page || 1;
                    if (pages <= 7 || p === 1 || p === pages || Math.abs(p - cur) <= 1) {
                      return (
                        <button
                          key={p}
                          onClick={() => setFilters((f) => ({ ...f, page: p }))}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all font-mono ${
                            cur === p
                              ? "bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                              : "text-[var(--text-2)] hover:bg-[var(--elevated)] hover:text-[var(--text-1)]"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === 2 && cur > 4) return <span key={p} className="text-[var(--text-3)] text-xs">…</span>;
                    if (p === pages - 1 && cur < pages - 3) return <span key={p} className="text-[var(--text-3)] text-xs">…</span>;
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(pages, (f.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= pages}
                  className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed px-4 text-xs"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
