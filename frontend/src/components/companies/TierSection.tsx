import type { Company } from "@/lib/types";
import { CompanyCard } from "./CompanyCard";

interface TierSectionProps {
  title: string;
  companies: Company[];
}

export function TierSection({ title, companies }: TierSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </section>
  );
}
