from __future__ import annotations

import logging

import httpx
from flask import Blueprint, jsonify, request

from story_backend.config import SMALLEST_API_KEY, SMALLEST_BASE_URL

log = logging.getLogger(__name__)

transcription_bp = Blueprint("transcription", __name__)

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@transcription_bp.post("/transcribe")
def transcribe():
    """Transcribe an audio file to text using Smallest AI Pulse.
    ---
    tags:
      - Transcription
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: Audio file to transcribe (WAV). Max 25 MB.
      - in: formData
        name: language
        type: string
        required: false
        default: en
        description: Language code for transcription (e.g. "en").
    responses:
      200:
        description: Transcription completed successfully.
        schema:
          type: object
          properties:
            transcription:
              type: string
              example: "Once upon a time there was a little red hen."
            audio_length:
              type: number
              example: 1.7
            language:
              type: string
              example: en
      400:
        description: No audio file provided or bad request.
      401:
        description: Invalid or missing API key.
      413:
        description: File exceeds 25 MB limit.
      502:
        description: Upstream transcription service error.
    """
    file = request.files.get("file")
    if not file:
        return jsonify(error="No audio file provided"), 400

    language = request.form.get("language", "en")

    audio_bytes = file.read()
    if len(audio_bytes) > MAX_FILE_SIZE:
        return jsonify(error="File exceeds 25 MB limit"), 413

    url = f"{SMALLEST_BASE_URL}/api/v1/pulse/get_text"
    headers = {
        "Authorization": f"Bearer {SMALLEST_API_KEY}",
        "Content-Type": "audio/wav",
    }
    params = {"model": "pulse", "language": language}

    try:
        resp = httpx.post(
            url,
            headers=headers,
            params=params,
            content=audio_bytes,
            timeout=60.0,
        )
    except httpx.RequestError as exc:
        log.error("Transcription request failed: %s", exc)
        return jsonify(error="Failed to reach transcription service"), 502

    if resp.status_code == 401:
        return jsonify(error="Invalid or missing API key"), 401
    if resp.status_code == 400:
        detail = resp.json().get("detail", resp.text) if resp.headers.get("content-type", "").startswith("application/json") else resp.text
        return jsonify(error=f"Bad request: {detail}"), 400
    if resp.status_code != 200:
        log.error("Pulse API returned %s: %s", resp.status_code, resp.text)
        return jsonify(error="Transcription service error"), 502

    data = resp.json()

    return jsonify(
        transcription=data.get("transcription", ""),
        audio_length=data.get("audio_length", 0),
        language=language,
    )
