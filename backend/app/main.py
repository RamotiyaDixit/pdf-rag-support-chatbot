from __future__ import annotations

import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .rag import rag_service
from .schemas import ChatRequest, ChatResponse, DocumentSummary, IngestResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF RAG Support Chatbot API",
    version="0.1.0",
    description="Grounded answers from uploaded PDFs with document and page citations.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload", response_model=IngestResponse)
async def upload_pdf(file: UploadFile = File(...)) -> dict:
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB limit.")
    try:
        return rag_service.ingest_pdf(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("PDF ingestion failed")
        raise HTTPException(status_code=500, detail="PDF ingestion failed. Check API logs.") from exc


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> dict:
    try:
        return rag_service.chat(request.question.strip())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Chat request failed")
        raise HTTPException(status_code=500, detail="Chat request failed. Check API logs.") from exc


@app.get("/documents", response_model=list[DocumentSummary])
def documents() -> list[dict]:
    try:
        return rag_service.list_documents()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Could not list indexed documents")
        raise HTTPException(status_code=500, detail="Could not list documents. Check API logs.") from exc
