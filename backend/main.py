from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from settings import settings
from api.v1.router import router as v1_router


app = FastAPI(debug=settings.DEBUG)

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)
