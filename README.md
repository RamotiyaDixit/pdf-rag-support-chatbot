# PDF RAG Support Chatbot

A source-grounded support chatbot for internal PDFs. Upload user manuals, FAQs and SOPs, then ask questions and receive answers with document and page citations. If retrieved context is weak or the model cannot cite its answer, the app abstains instead of guessing.

## Features

- FastAPI `/chat`, `/upload`, `/documents`, and `/health` endpoints.
- PDF text extraction with page-level metadata using PyMuPDF.
- Recursive chunking with configurable size/overlap.
- Qdrant vector database, OpenAI embeddings, and OpenAI chat model through LangChain.
- React/Vite chat interface with uploaded-document list, PDF upload, source excerpts, page references, loading states, and abstention indication.
- Docker Compose local setup, smoke evaluation, and parsing tests.

## Quick start

**Prerequisites:** Docker Desktop / Docker Engine with Compose, and an OpenAI API key.

1. Clone this repository.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
3. Run `docker compose up --build`.
4. Open the UI at [http://localhost:5173](http://localhost:5173), or API docs at [http://localhost:8000/docs](http://localhost:8000/docs).
5. Upload a text-based PDF through the UI and ask questions.

Qdrant data persists in the `qdrant_data` Docker volume. Set your API key locally; do not commit `.env`.

## API

### `POST /upload`
Multipart upload with field `file`. Supports PDF only (25 MB default limit). It extracts text page by page, splits the content into chunks, and indexes metadata including source filename, page number and chunk ID.

### `POST /chat`
JSON request: `{"question":"How do I reset my device?"}`. Response shape:

```json
{
  "answer": "Try reconnecting the power adapter [guide.pdf, p. 2].",
  "sources": [{"source":"guide.pdf","page":2,"excerpt":"...","score":0.62}],
  "abstained": false
}
```

### `GET /documents`
Lists indexed source filenames and chunk counts.

### `GET /health`
Basic API liveness endpoint.

## Configuration

See `.env.example` for the chat model, embedding model, chunk size/overlap, retrieval count, score threshold, file-size limit and CORS origins. Similarity scores are not calibrated probabilities; tune `MIN_RELEVANCE_SCORE` on a reviewed evaluation set for your PDFs.

## Evaluation

The `evaluation/` folder contains starter questions and a basic smoke runner:

```bash
python evaluation/run_smoke_eval.py
```

Add the customer-provided 15–20 questions, expected answers and expected sources before sign-off. The current smoke runner checks citations/abstention heuristically and **does not** assess factual correctness or replace RAGAS/human review. No accuracy scores are claimed until the real document corpus and expected answers are provided.

## Important limitations and production hardening

- Scanned/image-only PDFs are rejected with an explanation; OCR is not included.
- This initial demo has no authentication, per-user tenancy, document deletion UI, audit logging, malware scanning, or rate limiting.
- It does not provide a guaranteed hallucination-free system. Validate chunking and retrieval thresholds on real documents before customer-facing use.
- Production deployment should add auth/authorization, upload validation/scanning, structured observability, backup/restore, retention/deletion controls, and secret management.
- The app requires an OpenAI API key and external API billing.

## Ownership

The source code in this repository is available for you to use and modify. OpenAI API, hosting and other provider costs are separate.
