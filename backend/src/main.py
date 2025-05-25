from contextlib import asynccontextmanager

import aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.router import router as v1_router
from settings import settings


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    host = settings.HOST
    port = settings.REDIS_PORT
    db = settings.REDIS_DB
    try:
        fastapi_app.state.redis = aioredis.Redis.from_url(
            f'redis://{host}:{port}/{db}', decode_responses=True)
    except aioredis.RedisError as e:
        print(e, flush=True)
        raise
    yield
    await fastapi_app.state.redis.close()

app = FastAPI(debug=settings.DEBUG, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)
