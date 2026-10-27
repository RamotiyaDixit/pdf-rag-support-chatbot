from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "pdf_support_chunks"
    chunk_size: int = 900
    chunk_overlap: int = 150
    retrieval_k: int = 5
    min_relevance_score: float = 0.18
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 25

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
