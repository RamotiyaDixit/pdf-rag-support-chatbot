# PDF RAG Support Chatbot

A source-grounded support chatbot for internal PDFs. It ingests PDFs with page-level metadata, retrieves relevant chunks from Qdrant, answers with OpenAI, and cites source document/page. If the retrieved context is insufficient, it abstains instead of guessing.

## Features

- PDF upload and indexing with page-level citations
- FastAPI `/chat`, `/upload`, `/documents`, and `/health` endpoints
- Qdrant vector store; OpenAI embeddings and chat model
- React + Vite chat UI with clickable source references
- Grounding threshold and explicit abstention behavior
- Docker Compose for local deployment
- Demo PDF/document fixture and evaluation questions

## Requirements

- Docker Desktop / Docker Engine with Compose
- An OpenAI API key

## Quick start

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Run `docker compose up --build`.
3. Open the UI at http://localhost:5173 and API docs at http://localhost:8000/docs.
4. Upload a PDF through the UI, wait for indexing, then ask questions. Responses include the source filename and page number.

The first request downloads the embedding model used by OpenAI's API and may take a few seconds. Qdrant data persists in a Docker volume.

## Configuration

See `.env.example` for model, chunk size, overlap, retrieval count, and minimum similarity settings. Similarity scores are not calibrated probabilities; tune `MIN_RELEVANCE_SCORE` against your own evaluation questions before production use.

## API

### `POST /upload`
Multipart form upload with a `file` field. Accepts PDFs only, extracts text page by page, chunks it, and stores metadata (`source`, `page`, `chunk_id`).

### `POST /chat`
JSON body: `{ "question": "How do I reset a device?" }`. Returns `answer`, `sources`, and `abstained`.

### `GET /documents`
Lists indexed document names and chunk counts.

### `GET /health`
Basic service health.

## Evaluation

`evaluation/questions.json` contains sample in-scope and out-of-scope questions. The lightweight evaluation runner checks the service's abstention behavior and whether returned answers include source citations. It is a smoke evaluation, not a substitute for a reviewed gold set or a full RAGAS run. Add the customer-provided 15–20 questions and expected sources before sign-off.

## Production hardening checklist

Before exposing this beyond a trusted internal demo: add authentication/authorization, upload size and rate limits, malware scanning, deletion/re-indexing workflows, persistent document registry, structured observability, prompt-injection tests, tenant isolation if multi-customer, backup/restore, and deployment secrets management. Source citations and the abstention threshold should be validated on representative PDFs, including scanned PDFs (OCR is not enabled in this demo).

## Repository ownership

All application source code in this repository is intended for your use and modification. OpenAI API usage and hosting are billed separately by their providers.
