import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCompany } from "@/lib/api";
import { LevelBadge } from "@/components/jobs/LevelBadge";
import { RemotePill } from "@/components/jobs/RemotePill";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  let company;
  try {
    company = await getCompany(slug);
  } catch {
    return notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/companies" className="text-slate-400 hover:text-indigo-600">Companies</Link>
        <span className="text-slate-300 mx-2">›</span>
        <span className="text-slate-600">{company.name}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-400">{company.name[0]}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                company.tier === "faang_plus" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
              }`}>
                {company.tier === "faang_plus" ? "FAANG+" : "AI Startup"}
              </span>
            </div>
            <p className="text-sm text-slate-500">📍 {company.hq} · {company.size} employees</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{company.about}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Interview Loop */}
        {company.loop_desc && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-2">🔄 Interview Loop</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{company.loop_desc}</p>
          </div>
        )}

        {/* Comp Range */}
        {company.comp_range && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-2">💰 TC Ranges</h2>
            <div className="space-y-1">
              {company.comp_range.split("|").map((range, i) => (
                <p key={i} className="text-sm text-slate-600">{range.trim()}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Open Roles */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Open Roles ({company.open_roles})
        </h2>
        {company.jobs.length === 0 ? (
          <p className="text-slate-400 text-sm">No open SWE roles right now. Check back later.</p>
        ) : (
          <div className="space-y-3">
            {company.jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LevelBadge level={job.level} />
                  <span className="text-sm font-medium text-slate-800 truncate">{job.title}</span>
                  <RemotePill remote={job.remote} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Prep ✨
                  </Link>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition-colors"
                  >
                    Apply
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
