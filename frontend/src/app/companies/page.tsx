import { getCompanies } from "@/lib/api";
import { TierSection } from "@/components/companies/TierSection";

export const revalidate = 3600;

export default async function CompaniesPage() {
  let data;
  try {
    data = await getCompanies();
  } catch {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Failed to load companies. Is the backend running?</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Company Directory</h1>
        <p className="text-slate-500">
          {data.faang_plus.length + data.ai_startup.length} companies ·{" "}
          {data.faang_plus.reduce((s, c) => s + c.open_roles, 0) +
            data.ai_startup.reduce((s, c) => s + c.open_roles, 0)}{" "}
          open SWE roles
        </p>
      </div>

      <div className="space-y-12">
        <TierSection title="🏆 FAANG++ & Big Tech" companies={data.faang_plus} />
        <TierSection title="🚀 Leading AI Startups" companies={data.ai_startup} />
      </div>
    </div>
  );
}
