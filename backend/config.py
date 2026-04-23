from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    nasa_api_key: str
    openai_api_key: str
    database_url: str

    class Config:
        env_file = ".env"


settings = Settings()
