FROM python:3.14-slim
WORKDIR /app
RUN pip install poetry && poetry config virtualenvs.create false
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root
COPY src/ src/
ENV PYTHONPATH=/app/src
EXPOSE 5000
CMD ["flask", "--app", "story_backend.app", "run", "--host", "0.0.0.0", "--port", "5000"]
