from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOGLEVEL: str = 'INFO'
    DEBUG: bool = False
    REDIS_HOST: str = 'localhost'
    REDIS_PORT: int = 6379
    BACKEND_HOST: str = 'localhost'
    BACKEND_PORT: int
    REDIS_DB: int = 0
    MODEL_PATH: str

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
