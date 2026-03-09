from __future__ import annotations
import asyncpg
from typing import AsyncGenerator
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def create_pool(dsn: str) -> asyncpg.Pool:
    global _pool
    _pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool


@asynccontextmanager
async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn


async def apply_schema(conn: asyncpg.Connection, schema_path: str) -> None:
    import pathlib
    sql = pathlib.Path(schema_path).read_text()
    await conn.execute(sql)
    logger.info("Schema applied from %s", schema_path)
