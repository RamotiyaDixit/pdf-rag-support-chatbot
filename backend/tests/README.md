# Backend tests

Run from this directory after installing requirements:

```bash
pip install -r requirements.txt
PYTHONPATH=. pytest -q
```

These tests cover PDF text extraction and page/source metadata. Full end-to-end RAG tests need Qdrant and a valid OpenAI API key.
