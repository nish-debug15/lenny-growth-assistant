"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/lenny_assistant"

    @property
    def get_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Anthropic (direct API)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-haiku-20240307"

    # AWS Bedrock (legacy, unused)
    claude_code_use_bedrock: str = "0"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"

    # Groq
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    # Provider config
    default_provider: str = "groq"
    bedrock_timeout_seconds: int = 20

    # Retrieval
    similarity_threshold: float = 0.35
    retrieval_top_k: int = 5

    # Application
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
