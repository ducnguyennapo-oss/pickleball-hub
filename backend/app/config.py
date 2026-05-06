from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pickleball_user:dev@localhost:5432/pickleball"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET: str = "dev_secret_change_in_production"
    JWT_REFRESH_SECRET: str = "dev_refresh_secret_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # Zalo OA
    ZALO_OA_TOKEN: str = ""
    ZALO_OA_ID: str = ""

    # Momo
    MOMO_PARTNER_CODE: str = ""
    MOMO_ACCESS_KEY: str = ""
    MOMO_SECRET_KEY: str = ""
    MOMO_ENDPOINT: str = "https://test-payment.momo.vn/v2/gateway/api/create"

    # ZaloPay
    ZALOPAY_APP_ID: str = ""
    ZALOPAY_KEY1: str = ""
    ZALOPAY_KEY2: str = ""
    ZALOPAY_ENDPOINT: str = "https://sb-openapi.zalopay.vn/v2/create"

    # Webhook
    WEBHOOK_BASE_URL: str = "http://localhost:8000"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
