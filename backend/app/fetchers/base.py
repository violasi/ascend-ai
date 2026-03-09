from abc import ABC, abstractmethod
from typing import Any


class NormalizedJob:
    __slots__ = ("external_id", "title", "location", "remote", "department", "url", "description", "raw_json")

    def __init__(
        self,
        external_id: str,
        title: str,
        location: str,
        remote: bool,
        department: str,
        url: str,
        description: str,
        raw_json: dict,
    ):
        self.external_id = external_id
        self.title = title
        self.location = location
        self.remote = remote
        self.department = department
        self.url = url
        self.description = description
        self.raw_json = raw_json


class AbstractFetcher(ABC):
    """Fetch jobs from a specific ATS and normalize to NormalizedJob."""

    @abstractmethod
    async def fetch(self, board_id: str) -> list[NormalizedJob]:
        """Fetch all jobs for a board. Returns empty list on any error."""
        ...
