from __future__ import annotations

import logging

import httpx
from flask import Blueprint, jsonify, redirect, request

from story_backend.config import SMALLEST_BASE_URL, smallest_headers
from story_backend.db import get_client

log = logging.getLogger(__name__)

narration_bp = Blueprint("narration", __name__)

_TTS_PATH = "/api/v1/lightning-v2/get_speech"
_DEFAULT_VOICE_ID = "ashley"
_DEFAULT_SAMPLE_RATE = 24000
_DEFAULT_SPEED = 1.0
_WAV_HEADER_BYTES = 44
_BYTES_PER_SAMPLE = 2  # 16-bit PCM


def _duration_sec(audio_bytes: bytes, sample_rate: int) -> float:
    """Calculate WAV duration from raw byte length (16-bit PCM, mono)."""
    pcm_bytes = max(len(audio_bytes) - _WAV_HEADER_BYTES, 0)
    return round(pcm_bytes / (sample_rate * _BYTES_PER_SAMPLE), 2)


@narration_bp.post("/narrate")
def narrate():
    """Generate TTS audio for a text chunk via smallest.ai Lightning.
    ---
    tags:
      - Narration
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - text
            - voice_id
          properties:
            text:
              type: string
              example: "Once upon a time in a land far away..."
            voice_id:
              type: string
              example: "emily"
            speed:
              type: number
              example: 1.0
            language:
              type: string
              example: "auto"
            sample_rate:
              type: integer
              example: 24000
    responses:
      200:
        description: Narration completed.
        schema:
          type: object
          properties:
            chunk_id:
              type: string
              example: "e7d9c1a2-..."
            voice_id:
              type: string
            duration_sec:
              type: number
              example: 2.34
            status:
              type: string
              example: completed
      400:
        description: Missing text or voice_id.
      502:
        description: TTS provider error.
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    voice_id = data.get("voice_id") or _DEFAULT_VOICE_ID

    if not text:
        return jsonify(error="No text provided"), 400

    sample_rate = data.get("sample_rate", _DEFAULT_SAMPLE_RATE)
    speed = data.get("speed", _DEFAULT_SPEED)
    language = data.get("language", "en")

    payload = {
        "text": text,
        "voice_id": voice_id,
        "sample_rate": sample_rate,
        "speed": speed,
        "language": language,
        "output_format": "wav",
        "consistency": 0.5,
        "similarity": 0,
        "enhancement": 1,
    }

    try:
        resp = httpx.post(
            f"{SMALLEST_BASE_URL}{_TTS_PATH}",
            headers=smallest_headers(),
            json=payload,
            timeout=60.0,
        )
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        log.error("smallest.ai returned %s: %s", exc.response.status_code, exc.response.text)
        return jsonify(error="TTS provider error", detail=exc.response.text), 502
    except httpx.RequestError as exc:
        log.error("smallest.ai request failed: %s", exc)
        return jsonify(error="TTS provider unreachable"), 502

    audio_bytes = resp.content
    duration = _duration_sec(audio_bytes, sample_rate)

    convex = get_client()
    upload_url = convex.mutation("audioChunks:generateUploadUrl")
    upload_resp = httpx.post(upload_url, content=audio_bytes, headers={"Content-Type": "audio/wav"}, timeout=60.0)
    upload_resp.raise_for_status()
    storage_id = upload_resp.json()["storageId"]

    book_id = data.get("book_id")
    create_args: dict = {
        "text": text,
        "voiceId": voice_id,
        "sampleRate": sample_rate,
        "durationSec": duration,
        "storageId": storage_id,
    }
    if book_id:
        create_args["bookId"] = book_id
    chunk_id = convex.mutation("audioChunks:create", create_args)

    return jsonify(
        chunk_id=chunk_id,
        voice_id=voice_id,
        duration_sec=duration,
        status="completed",
    )


@narration_bp.get("/stream/<chunk_id>")
def stream(chunk_id):
    """Stream audio bytes for a narrated chunk.
    ---
    tags:
      - Narration
    parameters:
      - in: path
        name: chunk_id
        type: string
        required: true
        description: The chunk_id returned by /narrate.
    produces:
      - audio/wav
    responses:
      200:
        description: Streamed WAV audio bytes.
        schema:
          type: file
      404:
        description: chunk_id not found.
    """
    result = get_client().query("audioChunks:getUrl", {"id": chunk_id})
    if not result or not result.get("url"):
        return jsonify(error="chunk_id not found"), 404

    return redirect(result["url"])
