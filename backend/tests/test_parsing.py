import fitz

from app.rag import RAGService


def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def test_parse_pdf_keeps_page_numbers_and_source():
    pdf_bytes = make_pdf("A support guide says restart the device.")
    docs, pages = RAGService.parse_pdf(pdf_bytes, "guide.pdf")
    assert pages == 1
    assert docs[0].metadata["source"] == "guide.pdf"
    assert docs[0].metadata["page"] == 1
    assert "restart the device" in docs[0].page_content


def test_parse_pdf_rejects_empty_or_scanned_text():
    pdf_bytes = make_pdf("")
    try:
        RAGService.parse_pdf(pdf_bytes, "blank.pdf")
    except ValueError as exc:
        assert "No selectable text" in str(exc)
    else:
        raise AssertionError("Expected empty PDF text to be rejected")
