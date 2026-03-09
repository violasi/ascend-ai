import type { PaginatedJobs, JobDetail, CompaniesResponse, CompanyDetail, PrepPlan, ContentType, ResumeAnalysis, ProfileData } from "./types";

const isServer = typeof window === "undefined";
const API_BASE = isServer
  ? (process.env.BACKEND_URL || "http://localhost:8001")
  : "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    next: { revalidate: 300 },
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

export function getPersonalizedPrep(jobId: number, type: ContentType, resumeText: string): Promise<PrepPlan> {
  return apiFetch<PrepPlan>(`/api/jobs/${jobId}/prep/${type}/personalized`, {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText }),
    next: { revalidate: 0 },
  } as RequestInit);
}

export function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  return apiFetch<ResumeAnalysis>("/api/resume/analyze", {
    method: "POST",
    body: JSON.stringify({ resume_text: resumeText }),
    next: { revalidate: 0 },
  } as RequestInit);
}

export function refreshJobs(): Promise<{ refreshed: number }> {
  return apiFetch<{ refreshed: number }>("/api/refresh", { method: "POST" });
}

// Profile / session tracking

function noCache(options?: RequestInit): RequestInit {
  return { ...options, next: { revalidate: 0 } } as RequestInit;
}

export function getProfileData(analysisId: number): Promise<ProfileData> {
  return apiFetch<ProfileData>(`/api/profiles/${analysisId}/data`, noCache());
}

export function markApplied(analysisId: number, jobId: number): Promise<{ applied: boolean; job_id: number }> {
  return apiFetch(`/api/profiles/${analysisId}/apply/${jobId}`, noCache({ method: "POST" }));
}

export function unmarkApplied(analysisId: number, jobId: number): Promise<{ applied: boolean; job_id: number }> {
  return apiFetch(`/api/profiles/${analysisId}/apply/${jobId}`, noCache({ method: "DELETE" }));
}

export function markPrepViewed(analysisId: number, jobId: number, contentType: ContentType): Promise<{ ok: boolean }> {
  return apiFetch(`/api/profiles/${analysisId}/progress/${jobId}/${contentType}`, noCache({ method: "POST" }));
}
