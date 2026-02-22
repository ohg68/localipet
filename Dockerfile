FROM python:3.12-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ARG DJANGO_SETTINGS_MODULE=config.settings.dev
ENV DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE}

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements/ requirements/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements/dev.txt

# Copy project
COPY . .

# Collect static files (for production)
# RUN python manage.py collectstatic --noinput

# Create media directory
RUN mkdir -p /app/media

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
