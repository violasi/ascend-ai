import { LEVEL_COLORS } from "@/lib/utils";

export function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_COLORS[level] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {level}
    </span>
  );
}
