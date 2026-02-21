from __future__ import annotations

import logging

import httpx
from flask import Blueprint, jsonify, request

from story_backend.config import SMALLEST_API_KEY, SMALLEST_BASE_URL

log = logging.getLogger(__name__)

voices_bp = Blueprint("voices", __name__)

_TIMEOUT = httpx.Timeout(30.0)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _auth_headers() -> dict[str, str]:
    """Return the Authorization header for smallest.ai API calls."""
    return {"Authorization": f"Bearer {SMALLEST_API_KEY}"}


def _forward_error(resp: httpx.Response):
    """If the upstream response is an error, return a Flask response tuple.

    Maps 400, 401, and 429 to the same status; everything else becomes 502.
    Returns *None* when the response is successful (2xx).
    """
    if resp.is_success:
        return None

    status = resp.status_code
    try:
        body = resp.json()
    except Exception:
        body = {"error": resp.text}

    if status in (400, 401, 429):
        return jsonify(body), status

    log.error("smallest.ai %s %s -> %s: %s", resp.request.method, resp.request.url, status, resp.text)
    return jsonify(error="Upstream API error", detail=body), 502


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@voices_bp.post("/clone")
def clone_voice():
    """Clone a voice from an audio sample via smallest.ai.
    ---
    tags:
      - Voice
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: Audio sample for voice cloning (WAV, MP3).
      - in: formData
        name: name
        type: string
        required: false
        default: My Voice
        description: A friendly name for the cloned voice.
    responses:
      200:
        description: Voice cloned successfully.
        schema:
          type: object
          properties:
            voice_id:
              type: string
              example: "emily_SbScN4BKXK"
            name:
              type: string
              example: My Voice
            status:
              type: string
              example: ready
      400:
        description: No audio file provided.
      401:
        description: Invalid or missing API key.
      429:
        description: Rate-limited by smallest.ai.
    """
    file = request.files.get("file")
    name = request.form.get("name", "My Voice")
    if not file:
        return jsonify(error="No audio file provided"), 400

    url = f"{SMALLEST_BASE_URL}/api/v1/lightning-large/add_voice"
    files = {"file": (file.filename, file.stream, file.content_type or "audio/wav")}
    data = {"displayName": name}

    resp = httpx.post(url, headers=_auth_headers(), files=files, data=data, timeout=_TIMEOUT)

    err = _forward_error(resp)
    if err:
        return err

    payload = resp.json()
    voice_data = payload.get("data", {})

    return jsonify(
        voice_id=voice_data.get("voiceId"),
        name=name,
        status=voice_data.get("status", "ready"),
    )


@voices_bp.get("/voices")
def list_voices():
    """List all available voices (built-in + cloned).
    ---
    tags:
      - Voice
    responses:
      200:
        description: Combined list of built-in and cloned voices.
        schema:
          type: object
          properties:
            voices:
              type: array
              items:
                type: object
                properties:
                  voice_id:
                    type: string
                    example: "emily_SbScN4BKXK"
                  name:
                    type: string
                    example: Emily
                  tags:
                    type: object
      401:
        description: Invalid or missing API key.
      429:
        description: Rate-limited by smallest.ai.
    """
    headers = _auth_headers()

    # Fetch built-in voices and cloned voices in parallel.
    builtin_url = f"{SMALLEST_BASE_URL}/api/v1/lightning-v2/get_voices"
    cloned_url = f"{SMALLEST_BASE_URL}/api/v1/lightning-large/get_cloned_voices"

    with httpx.Client(headers=headers, timeout=_TIMEOUT) as client:
        builtin_resp = client.get(builtin_url)
        cloned_resp = client.get(cloned_url)

    # If either fails, forward the first error.
    err = _forward_error(builtin_resp)
    if err:
        return err
    err = _forward_error(cloned_resp)
    if err:
        return err

    builtin_voices = builtin_resp.json().get("voices", [])
    cloned_voices = cloned_resp.json().get("voices", [])

    # Normalise both lists to a common shape.
    combined = []
    for v in builtin_voices:
        combined.append({
            "voice_id": v.get("voiceId"),
            "name": v.get("displayName"),
            "tags": v.get("tags", {}),
            "cloned": False,
        })
    for v in cloned_voices:
        combined.append({
            "voice_id": v.get("voiceId"),
            "name": v.get("displayName"),
            "tags": v.get("tags", {}),
            "cloned": True,
        })

    return jsonify(voices=combined)


@voices_bp.delete("/voices/<voice_id>")
def delete_voice(voice_id: str):
    """Delete a cloned voice.
    ---
    tags:
      - Voice
    parameters:
      - in: path
        name: voice_id
        type: string
        required: true
        description: The voiceId of the cloned voice to delete.
    responses:
      200:
        description: Voice deleted successfully.
        schema:
          type: object
          properties:
            message:
              type: string
              example: Voice deleted.
      400:
        description: Bad request.
      401:
        description: Invalid or missing API key.
      429:
        description: Rate-limited by smallest.ai.
    """
    url = f"{SMALLEST_BASE_URL}/api/v1/lightning-large"
    resp = httpx.request(
        "DELETE",
        url,
        headers={**_auth_headers(), "Content-Type": "application/json"},
        json={"voiceId": voice_id},
        timeout=_TIMEOUT,
    )

    err = _forward_error(resp)
    if err:
        return err

    return jsonify(message="Voice deleted.")
