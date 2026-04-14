"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobs } from "@/lib/api";
import type { Job } from "@/lib/types";
import { LevelBadge } from "./LevelBadge";
import { RemotePill } from "./RemotePill";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

const PREVIEW_LIMIT = 6;

interface Props {
  onViewAll: () => void;
}

function YCJobMiniCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[#F97316]/40 hover:bg-[#F97316]/[0.03] transition-all duration-200"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-[var(--elevated)] border border-[var(--border)] overflow-hidden flex-shrink-0">
          <CompanyLogo
            name={job.company_name}
            logoUrl={job.company_logo_url}
            size={36}
            imgClassName="object-contain p-1"
            className="rounded-lg"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-[0.07em] truncate">
            {job.company_name}
          </p>
          <h3 className="text-[12.5px] font-bold text-[var(--text-1)] leading-snug group-hover:text-[#F97316] transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <LevelBadge level={job.level} />
        <RemotePill remote={job.remote} />
      </div>

      <p className="text-[11px] text-[var(--text-3)] truncate flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {job.location || "Remote"}
      </p>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-[var(--elevated)] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-[var(--elevated)] rounded w-16" />
          <div className="h-3 bg-[var(--elevated)] rounded w-full" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-10 bg-[var(--elevated)] rounded-full" />
        <div className="h-5 w-14 bg-[var(--elevated)] rounded-full" />
      </div>
      <div className="h-2.5 bg-[var(--elevated)] rounded w-24" />
    </div>
  );
}

export function YCStartupsSection({ onViewAll }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs({ tier: "yc_unicorn", limit: PREVIEW_LIMIT, page: 1 })
      .then((data) => {
        setJobs(data.items);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && jobs.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl border border-[#F97316]/20 bg-gradient-to-br from-[#F97316]/[0.04] to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F97316]/15">
        <div className="flex items-center gap-3">
          {/* YC logo */}
          <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(249,115,22,0.35)]">
            <span className="text-white font-black text-[15px] leading-none">Y</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[var(--text-1)] text-[15px] tracking-tight">
                YC & High-Growth Unicorns
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/25 leading-none">
                NEW
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5">
              Y Combinator alumni & unicorn startups actively hiring engineers
            </p>
          </div>
        </div>
        {total > 0 && (
          <button
            onClick={onViewAll}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#ea6e0e] transition-colors"
          >
            View all {total} roles
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Job cards grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: PREVIEW_LIMIT }).map((_, i) => <SkeletonCard key={i} />)
            : jobs.map((job) => <YCJobMiniCard key={job.id} job={job} />)}
        </div>

        {/* View all — mobile */}
        {total > 0 && (
          <div className="mt-4 sm:hidden">
            <button
              onClick={onViewAll}
              className="w-full py-2.5 text-xs font-semibold text-[#F97316] border border-[#F97316]/30 rounded-xl hover:bg-[#F97316]/5 transition-all flex items-center justify-center gap-1.5"
            >
              View all {total} YC & Unicorn roles
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* View all — desktop (when hidden in header due to no total yet) */}
        {total > PREVIEW_LIMIT && (
          <div className="hidden sm:flex mt-4 justify-center">
            <button
              onClick={onViewAll}
              className="py-2 px-5 text-xs font-semibold text-[#F97316] border border-[#F97316]/30 rounded-xl hover:bg-[#F97316]/5 transition-all flex items-center gap-1.5"
            >
              View all {total} roles →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
