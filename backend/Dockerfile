FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y build-essential default-libmysqlclient-dev pkg-config --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Render (and similar PaaS platforms) inject a dynamic $PORT the container
# must bind to; falls back to 8000 for plain `docker run` / local use.
# docker-compose.yml overrides this with the dev server command, so this
# production default only takes effect on an actual deploy.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
