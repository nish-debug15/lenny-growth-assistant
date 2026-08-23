"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration loaded from environment variables."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/lenny_assistant"

    # Anthropic Claude via Bedrock
    claude_code_use_bedrock: str = "1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    anthropic_model: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"

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
