export interface Job {
  id: number;
  title: string;
  level: string;
  location: string;
  remote: boolean;
  department: string;
  url: string;
  fetched_at: string;
  company_id: number;
  company_name: string;
  company_slug: string;
  company_logo_url: string;
  company_tier: string;
}

export interface JobDetail extends Job {
  description: string;
}

export interface PaginatedJobs {
  items: Job[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  ats_type: string;
  tier: string;
  hq: string;
  size: string;
  logo_url: string;
  about: string;
  loop_desc: string;
  comp_range: string;
  open_roles: number;
}

export interface CompanyDetail extends Company {
  jobs: Pick<Job, "id" | "title" | "level" | "location" | "remote" | "department" | "url">[];
}

export interface CompaniesResponse {
  faang_plus: Company[];
  ai_startup: Company[];
}

export type ContentType = "coding" | "system_design" | "behavioral" | "company_tips" | "edge_tech";

export interface PrepPlan {
  id: number;
  job_id: number;
  content_type: ContentType;
  content: string;
  model: string;
  generated_at: string;
  cached: boolean;
}
