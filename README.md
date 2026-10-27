# PDF RAG Support Chatbot

A source-grounded support chatbot for internal PDFs. Upload manuals, FAQs and SOPs; ask questions; receive answers with document/page citations. If retrieval is weak or the model cannot cite an answer, the app abstains instead of guessing.

## Features
- FastAPI `/chat`, `/upload`, `/documents`, and `/health` endpoints.
- PyMuPDF PDF text extraction with per-page metadata and configurable recursive chunking.
- Qdrant vector database, OpenAI embeddings and chat through LangChain.
- React/Vite chat UI with document upload, source excerpts, page references and abstention indication.
- Docker Compose setup, starter smoke evaluation, and parsing tests.

## Quick start
Prerequisites: Docker Desktop/Engine with Compose, plus an OpenAI API key.

1. Clone this repository.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
3. Run `docker compose up --build`.
4. Open [http://localhost:5173](http://localhost:5173) or API docs at [http://localhost:8000/docs](http://localhost:8000/docs).
5. Upload a text-based PDF and ask questions.

Qdrant data persists in the `qdrant_data` volume. Never commit `.env`.

## API
- `POST /upload`: multipart form field `file`; PDF only, 25 MB limit by default.
- `POST /chat`: JSON `{"question":"How do I reset my device?"}`. Returns `answer`, `sources`, and `abstained`.
- `GET /documents`: indexed filenames and chunk counts.
- `GET /health`: liveness endpoint.

## Evaluation
`evaluation/questions.json` includes starter in-scope/out-of-scope examples. Run `python evaluation/run_smoke_eval.py` when API and vector store are running. The runner checks citations and abstention heuristically; it does not assess factual correctness or replace RAGAS/human review. Replace the starter questions with the customer-provided 15–20 test questions before making quality claims.

## Limitations and production hardening
- Scanned/image-only PDFs are rejected; OCR is not included.
- This demo has no authentication, per-user tenancy, delete-document UI, audit logging, malware scanning or rate limiting.
- A RAG system is not guaranteed hallucination-free. Tune retrieval thresholds on a reviewed evaluation set.
- Before public deployment add auth, upload scanning/validation, observability, backup/restore, retention/deletion controls and secrets management.
- OpenAI API and hosting costs are separate.

All application source in this repository is intended for your use and modification.
