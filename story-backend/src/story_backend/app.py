import time
import uuid

from flasgger import Swagger
from flask import Flask, Response, jsonify, request

from story_backend.extract import extract_text

app = Flask(__name__)

app.config["SWAGGER"] = {
    "title": "Story Backend API",
    "description": "API for uploading books, cloning voices, narrating text, and streaming audio.",
    "version": "0.1.0",
    "openapi": "3.0.3",
}
Swagger(app)

# In-memory store for mock data
_voices = {}
_audio_chunks = {}


@app.post("/upload")
def upload():
    """Extract text from an uploaded file.
    ---
    tags:
      - Upload
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: The book file to upload (PDF, EPUB, TXT).
    responses:
      200:
        description: Extracted text split into chapters.
        schema:
          type: object
          properties:
            filename:
              type: string
              example: book.pdf
            pages:
              type: integer
              example: 12
            chapters:
              type: array
              items:
                type: object
                properties:
                  index:
                    type: integer
                  title:
                    type: string
                  text:
                    type: string
      400:
        description: No file provided.
    """
    file = request.files.get("file")
    if not file:
        return jsonify(error="No file provided"), 400

    try:
        result = extract_text(file)
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception as e:
        return jsonify(error=f"Extraction failed: {e}"), 500

    return jsonify(result)


@app.post("/clone")
def clone():
    """Clone a voice from an audio sample.
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
              example: "b3f1a2c4-..."
            name:
              type: string
              example: My Voice
            status:
              type: string
              example: ready
      400:
        description: No audio file provided.
    """
    file = request.files.get("file")
    name = request.form.get("name", "My Voice")
    if not file:
        return jsonify(error="No audio file provided"), 400

    voice_id = str(uuid.uuid4())
    _voices[voice_id] = {"name": name, "filename": file.filename}

    return jsonify(
        voice_id=voice_id,
        name=name,
        status="ready",
    )


@app.post("/narrate")
def narrate():
    """Generate TTS audio for a text chunk.
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
              example: "b3f1a2c4-..."
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
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    voice_id = data.get("voice_id")

    if not text:
        return jsonify(error="No text provided"), 400
    if not voice_id:
        return jsonify(error="No voice_id provided"), 400

    chunk_id = str(uuid.uuid4())
    _audio_chunks[chunk_id] = text

    return jsonify(
        chunk_id=chunk_id,
        voice_id=voice_id,
        duration_sec=round(len(text) * 0.06, 2),
        status="completed",
    )


@app.get("/stream/<chunk_id>")
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
    if chunk_id not in _audio_chunks:
        return jsonify(error="chunk_id not found"), 404

    def generate():
        for i in range(10):
            yield b"\x00\x01" * 512
            time.sleep(0.05)

    return Response(generate(), mimetype="audio/wav")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
