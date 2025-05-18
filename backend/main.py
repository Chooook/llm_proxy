import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI

from settings import settings
from api.v1.router import router as v1_router

app = FastAPI(debug=settings.DEBUG)

app.include_router(v1_router)
