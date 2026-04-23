from fastapi import APIRouter, HTTPException, Request
from schemas import NasaImage
from services.nasa_images import search_nasa_images
from limiter import limiter

router = APIRouter()


@router.get("/images/search", response_model=list[NasaImage])
@limiter.limit("60/minute")
async def search_images(q: str, page: int = 1, limit: int = 20, request: Request = None):
    if not q or not q.strip():
        raise HTTPException(status_code=422, detail="Query parameter 'q' must not be empty")
    if page < 1:
        raise HTTPException(status_code=422, detail="page must be >= 1")
    if not (1 <= limit <= 50):
        raise HTTPException(status_code=422, detail="limit must be between 1 and 50")
    return await search_nasa_images(q.strip(), page, limit)
