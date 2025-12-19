FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy lightweight requirements for Cloud Run
COPY requirements.cloudrun.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . ./backend

# Set Python path so 'backend' module can be found
ENV PYTHONPATH=/app

# Set environment variable to force Gemini-only mode (skip local model loading)
ENV USE_GEMINI_ONLY=true

# Expose Cloud Run port
EXPOSE 8080

# Command to run the application (production mode, no reload)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
