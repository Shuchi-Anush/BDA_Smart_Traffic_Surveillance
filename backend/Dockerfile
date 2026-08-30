FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=1 \
  PYTHONPATH=/app/src

COPY pyproject.toml uv.lock* ./
RUN pip install --upgrade pip && pip install uv && uv pip compile pyproject.toml > requirements.txt && pip install --no-cache-dir -r requirements.txt

COPY src ./src

EXPOSE 8000

CMD ["python", "-m", "backend"]
