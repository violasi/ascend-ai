import type { Job } from "@/lib/types";
import { JobCard } from "./JobCard";

interface JobGridProps {
  jobs: Job[];
  loading?: boolean;
}

export function JobGrid({ jobs, loading }: JobGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-200" />
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-5 w-10 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>
            <div className="h-8 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-500 text-lg">No jobs found matching your filters</p>
        <p className="text-slate-400 text-sm mt-1">Try broadening your search</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
