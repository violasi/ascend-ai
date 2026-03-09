import Link from "next/link";
import Image from "next/image";
import type { Company } from "@/lib/types";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all group block"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.name}
              width={40}
              height={40}
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="text-lg font-bold text-slate-400">{company.name[0]}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
            {company.name}
          </p>
          <p className="text-xs text-slate-500">{company.hq}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{company.about}</p>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          company.tier === "faang_plus" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
        }`}>
          {company.tier === "faang_plus" ? "FAANG+" : "AI Startup"}
        </span>
        <span className="text-xs text-slate-500">
          {company.open_roles} open {company.open_roles === 1 ? "role" : "roles"}
        </span>
      </div>
    </Link>
  );
}
