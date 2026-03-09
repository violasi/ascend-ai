import type { Job } from "@/lib/types";
import { JobCard } from "./JobCard";

interface JobGridProps {
  jobs: Job[];
  loading?: boolean;
  analysisId?: number | null;
  appliedJobIds?: Set<number>;
  prepProgress?: Record<string, string[]>;
  onAppliedChange?: (jobId: number, applied: boolean) => void;
}

function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2.5 skeleton rounded-full w-1/3" />
          <div className="h-4 skeleton rounded-full w-5/6" />
          <div className="h-4 skeleton rounded-full w-3/4" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-24 skeleton rounded-md" />
        <div className="h-5 w-16 skeleton rounded-md" />
      </div>
      <div className="flex justify-between">
        <div className="h-2.5 w-28 skeleton rounded-full" />
        <div className="h-2.5 w-16 skeleton rounded-full" />
      </div>
      <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
        <div className="flex-1 h-8 skeleton rounded-xl" />
        <div className="w-16 h-8 skeleton rounded-xl" />
      </div>
    </div>
  );
}

export function JobGrid({ jobs, loading, analysisId, appliedJobIds, prepProgress, onAppliedChange }: JobGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--elevated)] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[var(--text-1)] mb-1">No jobs found</p>
        <p className="text-xs text-[var(--text-3)]">Try broadening your search or clearing filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          analysisId={analysisId ?? null}
          isApplied={appliedJobIds?.has(job.id) ?? false}
          viewedTypes={prepProgress?.[String(job.id)] ?? []}
          onAppliedChange={onAppliedChange}
        />
      ))}
    </div>
  );
}
