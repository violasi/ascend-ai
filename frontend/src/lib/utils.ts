import { formatDistanceToNow } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export const LEVEL_COLORS: Record<string, string> = {
  "L3": "bg-green-100 text-green-800",
  "L4": "bg-blue-100 text-blue-800",
  "L5": "bg-indigo-100 text-indigo-800",
  "L6": "bg-purple-100 text-purple-800",
  "L7+": "bg-rose-100 text-rose-800",
};

export const CONTENT_TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  coding: { emoji: "📝", label: "Coding Plan" },
  system_design: { emoji: "🏗", label: "System Design" },
  behavioral: { emoji: "🎯", label: "Behavioral" },
  company_tips: { emoji: "🏢", label: "Company Tips" },
  edge_tech: { emoji: "⚡", label: "Edge Tech" },
};
