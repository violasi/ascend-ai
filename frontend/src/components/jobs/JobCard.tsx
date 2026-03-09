import Link from "next/link";
import Image from "next/image";
import type { Job } from "@/lib/types";
import { LevelBadge } from "./LevelBadge";
import { RemotePill } from "./RemotePill";
import { timeAgo } from "@/lib/utils";

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {job.company_logo_url ? (
            <Image
              src={job.company_logo_url}
              alt={job.company_name}
              width={40}
              height={40}
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="text-lg font-bold text-slate-400">
              {job.company_name[0]}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-0.5">{job.company_name}</p>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate group-hover:text-indigo-700 transition-colors">
            {job.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <LevelBadge level={job.level} />
        <RemotePill remote={job.remote} />
        {job.company_tier === "faang_plus" && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">FAANG+</span>
        )}
        {job.company_tier === "ai_startup" && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">AI Startup</span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
        <span>📍</span>
        <span className="truncate">{job.location || "Remote"}</span>
        <span className="ml-auto flex-shrink-0">{timeAgo(job.fetched_at)}</span>
      </p>

      <div className="flex gap-2">
        <Link
          href={`/jobs/${job.id}`}
          className="flex-1 text-center py-2 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          Get Prep Plan ✨
        </Link>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
        >
          Apply →
        </a>
      </div>
    </div>
  );
}
