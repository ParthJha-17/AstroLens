from pydantic import BaseModel


class ApodItem(BaseModel):
    date: str
    title: str
    explanation: str
    url: str
    hdurl: str | None = None
    media_type: str


class SearchResult(BaseModel):
    date: str
    title: str
    url: str
    media_type: str
    rank: float


class NasaImage(BaseModel):
    nasa_id: str
    title: str
    thumb_url: str | None = None
    date_created: str | None = None
    media_type: str = "image"


class Source(BaseModel):
    type: str
    title: str
    url: str


class GenerateBriefingRequest(BaseModel):
    apod_date: str


class Briefing(BaseModel):
    apod_date: str
    mission_context: str
    scientific_significance: str
    key_facts: list[str]
    sources: list[Source]
    generated_at: str
