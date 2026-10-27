# Backend tests

Run from this directory after installing requirements:

```bash
pip install -r requirements.txt
PYTHONPATH=. pytest -q
```

Tests cover PDF text extraction and source/page metadata. End-to-end RAG tests require Qdrant and a valid OpenAI API key.
