# KAG Unity Church Progressive Web App (PWA)

This repository contains a full-stack Progressive Web App (PWA) for KAG Unity Church, including a React + Vite frontend and a Django REST backend.

## Structure

- `frontend/` — React PWA user interface
- `backend/` — Django REST API server

## Setup

### Backend

1. Create a Python virtual environment:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and configure your database and secret key.
3. Run migrations:
   ```powershell
   python manage.py migrate
   python manage.py createsuperuser
   ```
4. Start the backend server:
   ```powershell
   python manage.py runserver
   ```

### Frontend

1. Install packages:
   ```powershell
   cd frontend
   npm install
   ```
2. Start development server:
   ```powershell
   npm run dev
   ```

## Features

- Installable PWA experience
- Offline caching with service worker
- JWT authentication
- Sermons, events, prayer requests, ministries, notifications
- Admin API management

## Docker Compose (optional)

From the project root you can build and run the full stack with Docker Compose:

```bash
docker-compose up --build
```

This starts MySQL, the Django backend on port `8000`, and the frontend preview on port `5173`.

For local development without Docker see the existing Backend and Frontend sections above.
