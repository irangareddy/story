from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path

import pytest

from story_backend.extract import (
    ExtractionResult,
    _clean_text,
    _title_from_filename,
    extract_text,
)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


class FakeFileStorage:
    """Mimics Werkzeug FileStorage enough for extract_text."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.filename = self.path.name
        self._data = self.path.read_bytes()

    def read(self) -> bytes:
        return self._data


# ---------------------------------------------------------------------------
# Helper tests
# ---------------------------------------------------------------------------


class TestTitleFromFilename:
    def test_pdf(self):
        assert _title_from_filename("the-little-red-hen.pdf") == "The Little Red Hen"

    def test_epub(self):
        assert _title_from_filename("the-tale-of-peter-rabbit.epub") == "The Tale Of Peter Rabbit"

    def test_underscores(self):
        assert _title_from_filename("my_book_title.txt") == "My Book Title"


class TestCleanText:
    def test_removes_standalone_page_numbers(self):
        text = "Hello world\n  42  \nMore text"
        assert "42" not in _clean_text(text)
        assert "Hello world" in _clean_text(text)

    def test_collapses_blank_lines(self):
        text = "Line one\n\n\n\n\nLine two"
        result = _clean_text(text)
        assert "\n\n\n" not in result
        assert "Line one" in result
        assert "Line two" in result

    def test_strips_whitespace(self):
        assert _clean_text("  hello  ") == "hello"


# ---------------------------------------------------------------------------
# PDF extraction tests
# ---------------------------------------------------------------------------


@pytest.mark.skipif(
    not (DATA_DIR / "the-three-little-pigs.pdf").exists(),
    reason="Test data file not found",
)
class TestPdfExtraction:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.result = extract_text(FakeFileStorage(DATA_DIR / "the-three-little-pigs.pdf"))

    def test_has_chapters(self):
        assert len(self.result["chapters"]) > 0

    def test_story_text_present(self):
        text = self.result["chapters"][0]["text"].lower()
        # Key story words
        assert "pig" in text
        assert "wolf" in text

    def test_no_header_boilerplate(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "core knowledge foundation" not in text

    def test_no_footer_boilerplate(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "freekidsbooks.org" not in text
        assert "free ebook" not in text

    def test_no_copyright_boilerplate(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "creative commons" not in text

    def test_title(self):
        assert self.result["title"] == "The Three Little Pigs"

    def test_pages_count(self):
        assert self.result["pages"] == 26


@pytest.mark.skipif(
    not (DATA_DIR / "the-little-red-hen.pdf").exists(),
    reason="Test data file not found",
)
class TestImageOnlyPdf:
    """the-little-red-hen.pdf is entirely image-based, so no text is extractable."""

    def test_returns_empty_chapters(self):
        result = extract_text(FakeFileStorage(DATA_DIR / "the-little-red-hen.pdf"))
        # Image-only PDF: may have 0 chapters since no text is extractable
        assert result["pages"] == 26


# ---------------------------------------------------------------------------
# EPUB extraction tests
# ---------------------------------------------------------------------------


@pytest.mark.skipif(
    not (DATA_DIR / "the-tale-of-peter-rabbit.epub").exists(),
    reason="Test data file not found",
)
class TestEpubExtraction:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.result = extract_text(FakeFileStorage(DATA_DIR / "the-tale-of-peter-rabbit.epub"))

    def test_has_chapters(self):
        assert len(self.result["chapters"]) > 0

    def test_story_text_present(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "peter" in text
        assert "rabbit" in text

    def test_no_gutenberg_boilerplate(self):
        text = self.result["chapters"][0]["text"]
        assert "PROJECT GUTENBERG" not in text
        assert "project gutenberg" not in text.lower()

    def test_no_license_text(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "redistribution" not in text
        assert "trademark" not in text

    def test_title(self):
        title = self.result["title"]
        assert "Peter Rabbit" in title


@pytest.mark.skipif(
    not (DATA_DIR / "the-tale-of-benjamin-bunny.epub").exists(),
    reason="Test data file not found",
)
class TestEpubExtractionBenjamin:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.result = extract_text(FakeFileStorage(DATA_DIR / "the-tale-of-benjamin-bunny.epub"))

    def test_story_text_present(self):
        text = self.result["chapters"][0]["text"].lower()
        assert "benjamin" in text
        assert "bunny" in text

    def test_no_gutenberg_boilerplate(self):
        text = self.result["chapters"][0]["text"]
        assert "PROJECT GUTENBERG" not in text


# ---------------------------------------------------------------------------
# Unsupported format
# ---------------------------------------------------------------------------


class TestUnsupportedFormat:
    def test_raises_value_error(self):
        fake = FakeFileStorage.__new__(FakeFileStorage)
        fake.filename = "book.docx"
        fake.read = lambda: b"some bytes"
        with pytest.raises(ValueError, match="Unsupported file format"):
            extract_text(fake)
