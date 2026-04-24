import httpx

_IMAGES_URL = "https://images-api.nasa.gov/search"


async def search_nasa_images(q: str, page: int = 1, limit: int = 20) -> list[dict]:
    params = {"q": q, "media_type": "image", "page": page}
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        resp = await client.get(_IMAGES_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    items = data.get("collection", {}).get("items", [])
    results = []
    for item in items[:limit]:
        meta = item.get("data", [{}])[0]
        links = item.get("links", [])
        thumb = next((l["href"] for l in links if l.get("rel") == "preview"), None)
        results.append({
            "nasa_id": meta.get("nasa_id", ""),
            "title": meta.get("title", ""),
            "thumb_url": thumb,
            "date_created": meta.get("date_created", "")[:10] if meta.get("date_created") else None,
            "media_type": "image",
        })
    return results


async def get_nasa_image(nasa_id: str) -> dict | None:
    params = {"nasa_id": nasa_id}
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
        resp = await client.get(_IMAGES_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    items = data.get("collection", {}).get("items", [])
    if not items:
        return None
    item = items[0]
    meta = item.get("data", [{}])[0]
    links = item.get("links", [])
    thumb = next((l["href"] for l in links if l.get("rel") == "preview"), None)
    return {
        "nasa_id": meta.get("nasa_id", ""),
        "title": meta.get("title", ""),
        "description": meta.get("description"),
        "keywords": meta.get("keywords", []),
        "thumb_url": thumb,
        "date_created": meta.get("date_created", "")[:10] if meta.get("date_created") else None,
        "media_type": meta.get("media_type", "image"),
    }
