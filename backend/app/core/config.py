from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_path: str = "./mat.db"

    jwt_secret_key: str = "change-me-to-a-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "mat-notifications@example.com"

    azure_devops_org_url: str = ""
    azure_devops_project: str = ""
    azure_devops_pat: str = ""

    cors_origins: str = "http://localhost:5173"

    default_admin_employee_name: str = "John Admin"
    default_admin_mail_id: str = "john@example.com"
    default_admin_employee_id: str = "E0001"
    default_admin_password: str = "ChangeMe123!"

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
