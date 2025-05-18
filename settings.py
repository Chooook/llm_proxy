from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOGLEVEL: str = 'INFO'
    DEBUG: bool = False
    REDIS_HOST: str = 'localhost'
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
