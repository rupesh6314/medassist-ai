FROM python:3.10-slim

# Prevent python from buffering stdout/stderr and writing pyc files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies: Tesseract OCR, English training data, poppler-utils, and image/cv libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY fastapi-service/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

# Copy ML models, datasets, and FastAPI service code into the container
COPY ml/ /app/ml/
COPY data_source/ /app/data_source/
COPY fastapi-service/ /app/

# Expose Render PORT or default 8000
ENV PORT=8000
EXPOSE 8000

# Run uvicorn bound to 0.0.0.0 and dynamically assigned $PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
