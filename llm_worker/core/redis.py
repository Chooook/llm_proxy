import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

import redis

from settings import settings


redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB)
