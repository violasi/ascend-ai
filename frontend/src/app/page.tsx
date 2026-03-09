"use client";

import { useState, useEffect, useCallback } from "react";
import { getJobs, getCompanies, type JobFilters } from "@/lib/api";
import type { Job, Company } from "@/lib/types";
import { JobGrid } from "@/components/jobs/JobGrid";
import { JobFiltersPanel } from "@/components/jobs/JobFilters";

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 21 });

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
      .then((data) => setCompanies([...data.faang_plus, ...data.ai_startup]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          SWE Jobs at FAANG++ & AI Startups
        </h1>
        <p className="text-slate-500">
          {total > 0 ? (
            <>{total} real SWE roles · click any job for AI-powered interview prep</>
          ) : (
            "Real-time listings with personalized Claude Opus preparation plans"
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <JobFiltersPanel
            filters={filters}
            companies={companies}
            onChange={setFilters}
          />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <JobGrid jobs={jobs} loading={loading} />

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                disabled={(filters.page || 1) <= 1}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                Page {filters.page || 1} of {pages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: Math.min(pages, (f.page || 1) + 1) }))}
                disabled={(filters.page || 1) >= pages}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
