import type { PaginatedJobs, JobDetail, CompaniesResponse, CompanyDetail, PrepPlan, ContentType } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json() as Promise<T>;
}

export interface JobFilters {
  q?: string;
  level?: string;
  remote?: boolean;
  company?: number;
  tier?: string;
  page?: number;
  limit?: number;
}

export function getJobs(filters: JobFilters = {}): Promise<PaginatedJobs> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.level) params.set("level", filters.level);
  if (filters.remote !== undefined) params.set("remote", String(filters.remote));
  if (filters.company) params.set("company", String(filters.company));
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiFetch<PaginatedJobs>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export function getJob(id: number): Promise<JobDetail> {
  return apiFetch<JobDetail>(`/api/jobs/${id}`);
}

export function getCompanies(): Promise<CompaniesResponse> {
  return apiFetch<CompaniesResponse>("/api/companies");
}

export function getCompany(slug: string): Promise<CompanyDetail> {
  return apiFetch<CompanyDetail>(`/api/companies/${slug}`);
}

export function getPrep(jobId: number, type: ContentType): Promise<PrepPlan> {
  return apiFetch<PrepPlan>(`/api/jobs/${jobId}/prep/${type}`);
}

export function refreshJobs(): Promise<{ refreshed: number }> {
  return apiFetch<{ refreshed: number }>("/api/refresh", { method: "POST" });
}
