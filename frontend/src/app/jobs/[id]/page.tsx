import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getJob } from "@/lib/api";
import { LevelBadge } from "@/components/jobs/LevelBadge";
import { RemotePill } from "@/components/jobs/RemotePill";
import { PrepAccordion } from "@/components/prep/PrepAccordion";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const jobId = Number(id);
  if (isNaN(jobId)) return notFound();

  let job;
  try {
    job = await getJob(jobId);
  } catch {
    return notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-slate-400 hover:text-indigo-600">Jobs</Link>
        <span className="text-slate-300 mx-2">›</span>
        <span className="text-slate-600">{job.company_name}</span>
      </nav>

      {/* Job header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {job.company_logo_url ? (
              <Image
                src={job.company_logo_url}
                alt={job.company_name}
                width={56}
                height={56}
                className="object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-400">{job.company_name[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <Link
              href={`/companies/${job.company_slug}`}
              className="text-sm text-slate-500 hover:text-indigo-600 mb-1 block"
            >
              {job.company_name}
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <LevelBadge level={job.level} />
          <RemotePill remote={job.remote} />
          {job.company_tier === "faang_plus" && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">FAANG+</span>
          )}
          {job.location && (
            <span className="text-sm text-slate-500">📍 {job.location}</span>
          )}
          {job.department && (
            <span className="text-sm text-slate-500">🏛 {job.department}</span>
          )}
        </div>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Apply Now →
        </a>
      </div>

      {/* Prep Accordion */}
      <PrepAccordion jobId={jobId} />

      {/* Job description */}
      {job.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Job Description</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>
      )}
    </div>
  );
}
