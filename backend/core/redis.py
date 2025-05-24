import redis

from settings import settings


redis_client = redis.Redis(
    host=settings.HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB)
