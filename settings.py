from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOGLEVEL: str = 'INFO'
    DEBUG: bool = False
    DATABASE_URL: str

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
