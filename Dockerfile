FROM python:3.12-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

# Install Python dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Build frontend
COPY frontend/ /app/frontend/
RUN cd /app/frontend && npm install && npm run build

# Copy backend
COPY backend/ /app/backend/
COPY README.md /app/

# Remove old DB so fresh one is created on startup
RUN rm -f /app/backend/ai_study.db

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
