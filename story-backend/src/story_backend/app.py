from flasgger import Swagger
from flask import Flask, jsonify, request

from story_backend.config import SMALLEST_API_KEY  # noqa: F401 — triggers dotenv load
from story_backend.extract import extract_text
from story_backend.narration import narration_bp
from story_backend.transcription import transcription_bp
from story_backend.voices import voices_bp

app = Flask(__name__)

app.config["SWAGGER"] = {
    "title": "Story Backend API",
    "description": "API for uploading books, cloning voices, narrating text, and streaming audio.",
    "version": "0.1.0",
    "openapi": "3.0.3",
}
Swagger(app)

app.register_blueprint(voices_bp)
app.register_blueprint(narration_bp)
app.register_blueprint(transcription_bp)


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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
