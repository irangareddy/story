from __future__ import annotations

import os
import logging

from dotenv import load_dotenv
from convex import ConvexClient

load_dotenv()

log = logging.getLogger(__name__)

CONVEX_URL: str = os.environ.get("CONVEX_URL", "")

if not CONVEX_URL:
    log.warning(
        "CONVEX_URL is not set. "
        "Database persistence will not work. "
        "Set it to your Convex deployment URL."
    )

_client: ConvexClient | None = None


def get_client() -> ConvexClient:
    """Return a singleton ConvexClient instance."""
    global _client
    if _client is None:
        _client = ConvexClient(CONVEX_URL)
    return _client
