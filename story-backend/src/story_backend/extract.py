from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

import ebooklib
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from ebooklib import epub


@dataclass
class ExtractionResult:
    filename: str
    title: str
    pages: int
    chapters: list[dict] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_text(file_storage) -> dict:
    """Dispatch extraction by file extension. Returns a JSON-ready dict."""
    filename = file_storage.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    data = file_storage.read()

    if ext == ".pdf":
        result = _extract_pdf(data, filename)
    elif ext == ".epub":
        result = _extract_epub(data, filename)
    elif ext == ".txt":
        result = _extract_txt(data, filename)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    return {
        "filename": result.filename,
        "title": result.title,
        "pages": result.pages,
        "chapters": result.chapters,
    }


# ---------------------------------------------------------------------------
# PDF extraction (PyMuPDF dict-mode with y-coordinate filtering)
# ---------------------------------------------------------------------------

_FRONT_MATTER_SIGNALS = re.compile(
    r"creative\s*commons|copyright|published\s+by|all\s+rights\s+reserved"
    r"|freekidsbooks|free\s+ebook|make\s+a\s+difference|isbn"
    r"|licensed\s+under|non-commercial|attribution|remixed|open\s+educational",
    re.IGNORECASE,
)

_BACK_MATTER_SIGNALS = re.compile(
    r"freekidsbooks|creative\s*commons|free\s+ebook|visit\s+us|"
    r"check\s+out|www\.|http|about\s+the\s+creators|about\s+engageny|"
    r"about\s+common\s+core|about\s+free\s+kids|reading\s+comprehension|"
    r"want\s+to\s+find\s+more|legal\s+note|image\s+attribution",
    re.IGNORECASE,
)

_PAGE_NUMBER_RE = re.compile(r"^\s*\d{1,4}\s*$")
_EXCESS_BLANK_LINES = re.compile(r"\n{3,}")

# Line-level patterns to strip from extracted PDF text
_BOILERPLATE_LINE_RE = re.compile(
    r"core\s+knowledge|freekidsbooks|free\s+ebook\s+from|"
    r"creative\s+commons|cc-by|cc-nc|"
    r"page\s+\d+\s*$|^\s*page\s+\d+",
    re.IGNORECASE,
)


def _extract_pdf(data: bytes, filename: str) -> ExtractionResult:
    doc = fitz.open(stream=data, filetype="pdf")
    page_count = doc.page_count

    # First pass: extract with y-coordinate filtering only (no line-level cleanup)
    # so front/back matter detection has full signal text to work with
    raw_pages: list[str] = []
    for page in doc:
        text = _extract_pdf_page_raw(page)
        raw_pages.append(text)
    doc.close()

    # Detect front matter: skip leading pages that are empty, very short
    # (title/cover pages), or dominated by boilerplate signals
    start = 0
    for i, text in enumerate(raw_pages):
        stripped = text.strip()
        if not stripped:
            start = i + 1
            continue
        # Very short pages at the start are title/cover pages
        if len(stripped) < 100:
            start = i + 1
            continue
        signal_chars = sum(len(m.group()) for m in _FRONT_MATTER_SIGNALS.finditer(text))
        if signal_chars > len(text) * 0.10:
            start = i + 1
        else:
            break

    # Detect back matter: skip trailing pages dominated by boilerplate
    end = len(raw_pages)
    for i in range(len(raw_pages) - 1, start - 1, -1):
        text = raw_pages[i]
        if not text.strip():
            end = i
            continue
        signal_chars = sum(len(m.group()) for m in _BACK_MATTER_SIGNALS.finditer(text))
        if signal_chars > len(text) * 0.10:
            end = i
        else:
            break

    # Second pass: apply line-level boilerplate removal + cleanup to story pages
    story_parts = []
    for text in raw_pages[start:end]:
        cleaned = _clean_pdf_text(text)
        if cleaned:
            story_parts.append(cleaned)

    full_text = "\n\n".join(story_parts)

    # Trim at "THE END" if present (catches trailing reading comprehension, etc.)
    end_match = re.search(r"-?\s*THE\s+END\s*-?", full_text)
    if end_match:
        full_text = full_text[:end_match.end()]

    full_text = _clean_text(full_text)
    title = _title_from_filename(filename)

    chapters = []
    if full_text.strip():
        chapters.append({"index": 0, "title": title, "text": full_text})

    return ExtractionResult(
        filename=filename,
        title=title,
        pages=page_count,
        chapters=chapters,
    )


def _extract_pdf_page_raw(page: fitz.Page) -> str:
    """Extract text from a single PDF page, filtering only headers/footers by y-coordinate."""
    height = page.rect.height
    if height == 0:
        return ""

    top_cutoff = height * 0.13
    bottom_cutoff = height * 0.87

    blocks = page.get_text("dict")["blocks"]
    lines = []
    for block in blocks:
        if block["type"] != 0:  # skip image blocks
            continue
        y0 = block["bbox"][1]
        y1 = block["bbox"][3]
        # Skip blocks entirely in header or footer zone
        if y1 <= top_cutoff or y0 >= bottom_cutoff:
            continue
        for line in block["lines"]:
            text = " ".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append(text)

    return "\n".join(lines)


def _clean_pdf_text(text: str) -> str:
    """Remove boilerplate lines and page numbers from a page's text."""
    lines = text.split("\n")
    lines = [l for l in lines
             if l.strip()
             and not _PAGE_NUMBER_RE.match(l)
             and not _BOILERPLATE_LINE_RE.search(l)]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# EPUB extraction (ebooklib + BeautifulSoup)
# ---------------------------------------------------------------------------

_GUTENBERG_START = re.compile(
    r"\*{3}\s*START OF THE PROJECT GUTENBERG EBOOK.*?\*{3}", re.IGNORECASE
)
_GUTENBERG_END = re.compile(
    r"\*{3}\s*END OF THE PROJECT GUTENBERG EBOOK.*?\*{3}", re.IGNORECASE
)

_SKIP_ITEM_PATTERNS = re.compile(
    r"toc\.|nav\.|cover\.|copyright|wrap\d|wrap-", re.IGNORECASE
)


def _extract_epub(data: bytes, filename: str) -> ExtractionResult:
    book = epub.read_epub(_epub_from_bytes(data))

    title = book.get_metadata("DC", "title")
    title = title[0][0] if title else _title_from_filename(filename)

    items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))

    story_parts = []
    for item in items:
        name = item.get_name()
        if _SKIP_ITEM_PATTERNS.search(name):
            continue

        content = item.get_content().decode("utf-8", errors="replace")
        text = _parse_epub_html(content)
        if text:
            story_parts.append(text)

    full_text = "\n\n".join(story_parts)

    # Strip Gutenberg preamble/postamble from combined text
    full_text = _strip_gutenberg_markers(full_text)
    full_text = _clean_text(full_text)

    chapters = []
    if full_text.strip():
        chapters.append({"index": 0, "title": str(title), "text": full_text})

    return ExtractionResult(
        filename=filename,
        title=str(title),
        pages=len(items),
        chapters=chapters,
    )


def _epub_from_bytes(data: bytes):
    """Write epub bytes to a temp file and read with ebooklib (it requires a file path)."""
    import tempfile
    tmp = tempfile.NamedTemporaryFile(suffix=".epub", delete=False)
    try:
        tmp.write(data)
        tmp.close()
        return tmp.name
    except Exception:
        os.unlink(tmp.name)
        raise


def _parse_epub_html(html: str) -> str:
    """Parse one EPUB HTML item, removing boilerplate elements."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove Gutenberg boilerplate elements by CSS class/id
    for selector in [
        "section.pg-boilerplate",
        "#pg-header",
        "#pg-footer",
        ".pg-boilerplate",
    ]:
        for el in soup.select(selector):
            el.decompose()

    # Remove image-only wrappers (divs with images but <10 chars of text)
    for div in soup.find_all("div"):
        if div.find("img") and len(div.get_text(strip=True)) < 10:
            div.decompose()

    # Remove <img> tags entirely
    for img in soup.find_all("img"):
        img.decompose()

    text = soup.get_text("\n", strip=True)
    return text


def _strip_gutenberg_markers(text: str) -> str:
    """Remove everything before START marker and after END marker."""
    m = _GUTENBERG_START.search(text)
    if m:
        text = text[m.end():]

    m = _GUTENBERG_END.search(text)
    if m:
        text = text[:m.start()]

    # Also remove any remaining "Project Gutenberg" lines
    lines = text.split("\n")
    lines = [l for l in lines if "PROJECT GUTENBERG" not in l.upper()]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# TXT extraction (simple fallback)
# ---------------------------------------------------------------------------

def _extract_txt(data: bytes, filename: str) -> ExtractionResult:
    text = data.decode("utf-8", errors="replace")
    text = _strip_gutenberg_markers(text)
    text = _clean_text(text)
    title = _title_from_filename(filename)

    chapters = []
    if text.strip():
        chapters.append({"index": 0, "title": title, "text": text})

    return ExtractionResult(
        filename=filename,
        title=title,
        pages=1,
        chapters=chapters,
    )


# ---------------------------------------------------------------------------
# Shared utilities
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    """Normalize whitespace and remove artifacts."""
    # Remove standalone page numbers
    text = re.sub(r"(?m)^\s*\d{1,4}\s*$", "", text)
    # Collapse excessive blank lines
    text = _EXCESS_BLANK_LINES.sub("\n\n", text)
    return text.strip()


def _title_from_filename(name: str) -> str:
    """'the-little-red-hen.pdf' -> 'The Little Red Hen'"""
    stem = os.path.splitext(os.path.basename(name))[0]
    return stem.replace("-", " ").replace("_", " ").title()
