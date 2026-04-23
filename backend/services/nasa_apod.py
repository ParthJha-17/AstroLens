import httpx
from config import settings

_APOD_URL = "https://api.nasa.gov/planetary/apod"


async def fetch_apod(date: str | None = None) -> dict:
    params = {"api_key": settings.nasa_api_key}
    if date:
        params["date"] = date
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        resp = await client.get(_APOD_URL, params=params)
        resp.raise_for_status()
        return resp.json()


async def fetch_apod_range(start: str, end: str) -> list[dict]:
    params = {"api_key": settings.nasa_api_key, "start_date": start, "end_date": end}
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        resp = await client.get(_APOD_URL, params=params)
        resp.raise_for_status()
        return resp.json()
