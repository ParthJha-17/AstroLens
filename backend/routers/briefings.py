import asyncio
import logging
from fastapi import APIRouter, HTTPException, Request
from schemas import Briefing, GenerateBriefingRequest
from db.queries import get_briefing, insert_briefing, get_apod_by_date, upsert_apod
from services.nasa_apod import fetch_apod
from agents.briefing_agent import generate_briefing as run_agent
from limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/briefings/generate", response_model=Briefing)
@limiter.limit("10/minute")
async def generate_briefing_route(body: GenerateBriefingRequest, request: Request):
    pool = request.app.state.pool

    existing = await get_briefing(pool, body.apod_date)
    if existing:
        logger.info("briefing cache hit for %s", body.apod_date)
        return existing

    apod = await get_apod_by_date(pool, body.apod_date)
    if not apod:
        apod_data = await fetch_apod(body.apod_date)
        apod = await upsert_apod(pool, apod_data)

    try:
        briefing_dict = await run_agent(apod["title"], apod["date"], apod["explanation"])
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Briefing generation timed out. Please try again.")
    except Exception as exc:
        logger.error("Agent error for %s: %s", body.apod_date, exc)
        raise HTTPException(status_code=503, detail="Briefing generation failed. Please try again.")

    briefing_dict["apod_date"] = body.apod_date
    return await insert_briefing(pool, briefing_dict)


@router.get("/briefings/{date}", response_model=Briefing)
async def get_briefing_route(date: str, request: Request):
    pool = request.app.state.pool
    briefing = await get_briefing(pool, date)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found for this date")
    return briefing
