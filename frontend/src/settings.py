from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    LOGLEVEL: str = 'DEBUG'
    DEBUG: bool = True
    HOST: str = '127.0.0.1'
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 5000

    class Config:
        env_file = '../.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
