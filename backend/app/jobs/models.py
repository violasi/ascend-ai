from pydantic import BaseModel
from datetime import datetime


class JobOut(BaseModel):
    id: int
    title: str
    level: str
    location: str
    remote: bool
    department: str
    url: str
    fetched_at: datetime
    company_id: int
    company_name: str
    company_slug: str
    company_logo_url: str
    company_tier: str


class JobDetail(JobOut):
    description: str


class PaginatedJobs(BaseModel):
    items: list[JobOut]
    total: int
    page: int
    limit: int
    pages: int
