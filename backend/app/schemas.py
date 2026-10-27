from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class SourceCitation(BaseModel):
    source: str
    page: int
    excerpt: str
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceCitation] = []
    abstained: bool = False


class IngestResponse(BaseModel):
    filename: str
    pages_read: int
    chunks_indexed: int
    message: str


class DocumentSummary(BaseModel):
    filename: str
    chunks: int
