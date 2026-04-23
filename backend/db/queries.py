import json
import logging
from datetime import date as date_type

logger = logging.getLogger(__name__)


def _d(s: str) -> date_type:
    return date_type.fromisoformat(s)


def _j(v):
    """Parse JSONB field — asyncpg may return string or native Python object."""
    if isinstance(v, str):
        return json.loads(v)
    return v


async def get_apod_by_date(pool, date: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT date::text, title, explanation, url, hdurl, media_type FROM apod_cache WHERE date = $1",
            _d(date),
        )
        if row:
            logger.info("apod cache hit for %s", date)
            return dict(row)
        return None


async def upsert_apod(pool, data: dict) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO apod_cache (date, title, explanation, url, hdurl, media_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (date) DO NOTHING
            RETURNING date::text, title, explanation, url, hdurl, media_type
            """,
            _d(data["date"]),
            data["title"],
            data["explanation"],
            data["url"],
            data.get("hdurl"),
            data.get("media_type", "image"),
        )
        if row is None:
            row = await conn.fetchrow(
                "SELECT date::text, title, explanation, url, hdurl, media_type FROM apod_cache WHERE date = $1",
                _d(data["date"]),
            )
        return dict(row)


async def get_apods_by_date_range(pool, start: str, end: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT date::text, title, explanation, url, hdurl, media_type FROM apod_cache WHERE date BETWEEN $1 AND $2 ORDER BY date",
            _d(start),
            _d(end),
        )
        return [dict(r) for r in rows]


async def upsert_apods_batch(pool, items: list[dict]) -> list[dict]:
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO apod_cache (date, title, explanation, url, hdurl, media_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (date) DO NOTHING
            """,
            [
                (
                    _d(item["date"]),
                    item["title"],
                    item["explanation"],
                    item["url"],
                    item.get("hdurl"),
                    item.get("media_type", "image"),
                )
                for item in items
            ],
        )
        rows = await conn.fetch(
            "SELECT date::text, title, explanation, url, hdurl, media_type FROM apod_cache WHERE date = ANY($1::date[]) ORDER BY date",
            [_d(item["date"]) for item in items],
        )
        return [dict(r) for r in rows]


async def search_apod(pool, q: str, limit: int = 20) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT date::text, title, url, media_type,
                   ts_rank(to_tsvector('english', title || ' ' || explanation),
                           plainto_tsquery('english', $1)) AS rank
            FROM apod_cache
            WHERE to_tsvector('english', title || ' ' || explanation)
                  @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT $2
            """,
            q,
            limit,
        )
        return [dict(r) for r in rows]


async def get_briefing(pool, date: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT apod_date::text, mission_context, scientific_significance, key_facts, sources, generated_at::text FROM briefings WHERE apod_date = $1",
            _d(date),
        )
        if row is None:
            return None
        r = dict(row)
        r["key_facts"] = _j(r["key_facts"])
        r["sources"] = _j(r["sources"])
        return r


async def insert_briefing(pool, briefing: dict) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO briefings (apod_date, mission_context, scientific_significance, key_facts, sources)
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
            ON CONFLICT (apod_date) DO NOTHING
            RETURNING apod_date::text, mission_context, scientific_significance, key_facts, sources, generated_at::text
            """,
            _d(briefing["apod_date"]),
            briefing["mission_context"],
            briefing["scientific_significance"],
            json.dumps(briefing["key_facts"]),
            json.dumps(briefing["sources"]),
        )
        if row is None:
            row = await conn.fetchrow(
                "SELECT apod_date::text, mission_context, scientific_significance, key_facts, sources, generated_at::text FROM briefings WHERE apod_date = $1",
                _d(briefing["apod_date"]),
            )
        r = dict(row)
        r["key_facts"] = _j(r["key_facts"])
        r["sources"] = _j(r["sources"])
        return r
