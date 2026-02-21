from __future__ import annotations

import os
import logging

from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger(__name__)

SMALLEST_API_KEY: str = os.environ.get("SMALLEST_API_KEY", "")
SMALLEST_BASE_URL: str = "https://waves-api.smallest.ai"

if not SMALLEST_API_KEY:
    log.warning(
        "SMALLEST_API_KEY is not set. "
        "TTS, voice cloning, and STT endpoints will fail. "
        "Get a key at https://console.smallest.ai/apikeys"
    )


def smallest_headers() -> dict[str, str]:
    """Return common headers for smallest.ai API calls."""
    return {
        "Authorization": f"Bearer {SMALLEST_API_KEY}",
        "Content-Type": "application/json",
    }
