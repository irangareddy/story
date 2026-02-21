from flasgger import Swagger
from flask import Flask, jsonify, request

from story_backend.config import SMALLEST_API_KEY  # noqa: F401 — triggers dotenv load
from story_backend.db import get_client
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

    book_id = get_client().mutation("books:create", {
        "filename": result["filename"],
        "title": result.get("title", result["filename"]),
        "format": result["filename"].rsplit(".", 1)[-1].lower(),
        "pageCount": result.get("pages"),
        "chapters": result.get("chapters", []),
    })

    return jsonify({**result, "book_id": book_id})


@app.get("/books")
def list_books():
    """List all stored books.
    ---
    tags:
      - Books
    responses:
      200:
        description: List of stored books.
        schema:
          type: object
          properties:
            books:
              type: array
              items:
                type: object
    """
    books = get_client().query("books:list")
    return jsonify(books=books)


@app.get("/books/<book_id>")
def get_book(book_id: str):
    """Get a stored book by ID.
    ---
    tags:
      - Books
    parameters:
      - in: path
        name: book_id
        type: string
        required: true
        description: The Convex book ID.
    responses:
      200:
        description: The stored book.
      404:
        description: Book not found.
    """
    book = get_client().query("books:get", {"id": book_id})
    if not book:
        return jsonify(error="Book not found"), 404
    return jsonify(book)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
