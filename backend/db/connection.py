import asyncpg
from config import settings


async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(settings.database_url, statement_cache_size=0)


async def close_pool(pool: asyncpg.Pool) -> None:
    await pool.close()
