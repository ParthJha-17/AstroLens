import logging
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Request
from schemas import ApodItem, SearchResult
from services.nasa_apod import fetch_apod, fetch_apod_range
from db.queries import get_apod_by_date, upsert_apod, get_apods_by_date_range, upsert_apods_batch, search_apod
from limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/apod/today", response_model=ApodItem)
@limiter.limit("60/minute")
async def get_apod_today(request: Request):
    pool = request.app.state.pool
    today = date.today().isoformat()
    cached = await get_apod_by_date(pool, today)
    if cached:
        return cached
    data = await fetch_apod()
    return await upsert_apod(pool, data)


@router.get("/apod/feed", response_model=list[ApodItem])
@limiter.limit("60/minute")
async def get_apod_feed(start: str, end: str, request: Request):
    try:
        start_date = date.fromisoformat(start)
        end_date = date.fromisoformat(end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    if (end_date - start_date).days > 30:
        raise HTTPException(status_code=400, detail="Date range must not exceed 30 days")

    pool = request.app.state.pool
    cached = await get_apods_by_date_range(pool, start, end)
    cached_dates = {r["date"] for r in cached}

    all_dates = {
        (start_date + timedelta(days=i)).isoformat()
        for i in range((end_date - start_date).days + 1)
    }
    missing = all_dates - cached_dates

    if missing:
        fetched = await fetch_apod_range(start, end)
        new_items = [f for f in fetched if f["date"] in missing]
        if new_items:
            cached = await upsert_apods_batch(pool, new_items)
        cached = await get_apods_by_date_range(pool, start, end)

    return cached


@router.get("/apod/search", response_model=list[SearchResult])
@limiter.limit("60/minute")
async def search_apod_route(q: str, request: Request, limit: int = 20):
    if not q or not q.strip():
        raise HTTPException(status_code=422, detail="Query parameter 'q' must not be empty")
    if not (1 <= limit <= 100):
        raise HTTPException(status_code=422, detail="limit must be between 1 and 100")
    pool = request.app.state.pool
    return await search_apod(pool, q.strip(), limit)
