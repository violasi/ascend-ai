from enum import Enum
from pydantic import BaseModel
from datetime import datetime


class ContentType(str, Enum):
    coding = "coding"
    system_design = "system_design"
    behavioral = "behavioral"
    company_tips = "company_tips"
    edge_tech = "edge_tech"


class PrepOut(BaseModel):
    job_id: int
    content_type: str
    content: str
    model: str
    generated_at: datetime
    cached: bool
