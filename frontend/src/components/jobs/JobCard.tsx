"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { LevelBadge } from "./LevelBadge";
import { RemotePill } from "./RemotePill";
import { timeAgo } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { markApplied, unmarkApplied } from "@/lib/api";

const TOTAL_PREP_TYPES = 5;

interface JobCardProps {
  job: Job;
  analysisId?: number | null;
  isApplied?: boolean;
  viewedTypes?: string[];
  onAppliedChange?: (jobId: number, applied: boolean) => void;
}

export function JobCard({ job, analysisId, isApplied = false, viewedTypes = [], onAppliedChange }: JobCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(isApplied);

  // Sync prop changes (e.g. when profile loads after mount)
  if (applied !== isApplied && !applying) {
    setApplied(isApplied);
  }

  async function handleApply(e: React.MouseEvent) {
    e.preventDefault();
    if (!analysisId) {
      window.open(job.url, "_blank", "noopener,noreferrer");
      return;
    }
    setApplying(true);
    try {
      if (applied) {
        await unmarkApplied(analysisId, job.id);
        setApplied(false);
        onAppliedChange?.(job.id, false);
      } else {
        await markApplied(analysisId, job.id);
        setApplied(true);
        onAppliedChange?.(job.id, true);
        window.open(job.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[var(--elevated)] border border-[var(--border)] overflow-hidden flex-shrink-0">
          <CompanyLogo
            name={job.company_name}
            logoUrl={job.company_logo_url}
            size={44}
            imgClassName="object-contain p-1"
            className="rounded-xl"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-[0.07em]">
              {job.company_name}
            </p>
            {applied && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25 leading-none">
                ✓ Applied
              </span>
            )}
          </div>
          <h3 className="font-bold text-[var(--text-1)] text-[13.5px] leading-snug tracking-tight group-hover:text-[var(--accent-light)] transition-colors duration-200 line-clamp-2">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <LevelBadge level={job.level} />
        <RemotePill remote={job.remote} />
        {job.company_tier === "faang_plus" && (
          <span className="badge border text-[var(--amber)] bg-[var(--amber)]/10 border-[var(--amber)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" /> FAANG+
          </span>
        )}
        {job.company_tier === "ai_startup" && (
          <span className="badge border text-[#C084FC] bg-[#8B5CF6]/10 border-[#8B5CF6]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]" /> AI Startup
          </span>
        )}
        {job.company_tier === "yc_unicorn" && (
          <span className="badge border text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20 font-bold">
            <span className="text-[9px] font-black leading-none">YC</span> Unicorn
          </span>
        )}
      </div>

      {/* Location + time */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-3)]">
        <span className="flex items-center gap-1.5 truncate font-medium">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{job.location || "Remote"}</span>
        </span>
        <span className="flex-shrink-0 ml-2 tabular-nums">{timeAgo(job.fetched_at)}</span>
      </div>

      {/* Prep progress dots */}
      {viewedTypes.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-3)] font-medium">Prep:</span>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_PREP_TYPES }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i < viewedTypes.length ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[var(--accent-light)] font-medium">{viewedTypes.length}/{TOTAL_PREP_TYPES}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
        <Link href={`/jobs/${job.id}`} className="btn-primary flex-1 text-xs py-2 font-bold tracking-tight">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Prep Plan
        </Link>
        <button
          onClick={handleApply}
          disabled={applying}
          className={`text-xs py-2 px-3 flex items-center gap-1 rounded-xl border font-semibold transition-all disabled:opacity-60 ${
            applied
              ? "bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]"
              : "btn-ghost"
          }`}
        >
          {applying ? "…" : applied ? "✓ Applied" : "Apply"}
          {!applied && !applying && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
