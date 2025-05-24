from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOGLEVEL: str = 'DEBUG'
    DEBUG: bool = True
    HOST: str = '127.0.0.1'
    BACKEND_PORT: int = 8000
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
