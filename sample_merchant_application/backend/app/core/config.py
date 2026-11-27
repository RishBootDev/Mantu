from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mantu_base_url: str
    mantu_key_id: str = ""
    mantu_key_secret: SecretStr = SecretStr("")
    mantu_webhook_secret: SecretStr = SecretStr("")

    merchant_app_database_url: str
    merchant_app_origin: str

    merchant_auto_capture: bool = True
    merchant_cookie_secure: bool = False

                           
    mantu_connect_timeout: float = 3.0
    mantu_read_timeout: float = 15.0
    mantu_max_attempts: int = 3

                                                                                
                                                            
    pending_attempt_retry_after_seconds: int = 30

    @property
    def mantu_configured(self) -> bool:
        key_id = self.mantu_key_id.strip()
        secret = self.mantu_key_secret.get_secret_value().strip()
        return bool(key_id and secret) and "replace" not in key_id and "replace" not in secret


@lru_cache
def get_settings() -> Settings:
    return Settings()
