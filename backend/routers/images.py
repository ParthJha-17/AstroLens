from fastapi import APIRouter, HTTPException, Request
from schemas import NasaImage
from services.nasa_images import search_nasa_images, get_nasa_image
from limiter import limiter

router = APIRouter()


@router.get("/images/search", response_model=list[NasaImage])
@limiter.limit("60/minute")
async def search_images(request: Request, q: str, page: int = 1, limit: int = 20):
    if not q or not q.strip():
        raise HTTPException(status_code=422, detail="Query parameter 'q' must not be empty")
    if page < 1:
        raise HTTPException(status_code=422, detail="page must be >= 1")
    if not (1 <= limit <= 50):
        raise HTTPException(status_code=422, detail="limit must be between 1 and 50")
    return await search_nasa_images(q.strip(), page, limit)


@router.get("/images/{nasa_id}", response_model=NasaImage)
@limiter.limit("60/minute")
async def get_image(nasa_id: str, request: Request):
    image = await get_nasa_image(nasa_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image
