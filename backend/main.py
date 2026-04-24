import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from db.connection import create_pool, close_pool
from routers import apod, images, briefings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    await close_pool(app.state.pool)


app = FastAPI(title="AstroLens API", version="1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://frontend-rose-six-21.vercel.app",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(apod.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(briefings.router, prefix="/api/v1")


@app.exception_handler(httpx.HTTPError)
async def nasa_api_error_handler(request, exc):
    return JSONResponse(status_code=503, content={"detail": "NASA API unavailable. Try again shortly."})


@app.get("/")
async def root():
    return {"status": "ok", "service": "AstroLens API"}
