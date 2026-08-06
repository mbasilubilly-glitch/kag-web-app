import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

_INSECURE_DEFAULT_SECRET_KEY = 'django-insecure-change-this'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', _INSECURE_DEFAULT_SECRET_KEY)
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost 127.0.0.1').split()

# The insecure fallback above only exists so a fresh dev checkout runs
# without ceremony - it must never reach a real deployment. Fail loudly at
# startup rather than silently serving with a well-known, guessable key
# (which breaks session/password-reset-token/CSRF signing security).
if not DEBUG and SECRET_KEY == _INSECURE_DEFAULT_SECRET_KEY:
    raise ImproperlyConfigured(
        'DJANGO_SECRET_KEY is not set. Generate one (e.g. '
        '`python -c "import secrets; print(secrets.token_urlsafe(50))"`) '
        'and set it in the environment before running with DJANGO_DEBUG=False.'
    )

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # Registered unconditionally (harmless no-op when CLOUDINARY_URL is
    # unset) - must come before staticfiles per django-cloudinary-storage's
    # own docs.
    'cloudinary_storage',
    'django.contrib.staticfiles',
    'cloudinary',
    'corsheaders',
    'rest_framework',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # Serves STATIC_ROOT directly from the Django process - the Docker
    # deployment is a single container with no separate static file host
    # (unlike the cPanel path, which maps /static to a directory via
    # Apache instead). Placed right after SecurityMiddleware per
    # whitenoise's own documented ordering.
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

USE_SQLITE = os.getenv('DJANGO_USE_SQLITE', 'False') == 'True'

# Render (and most PaaS DB add-ons) inject a single DATABASE_URL rather than
# discrete MYSQL_* vars - takes priority over both the SQLite and MySQL
# paths below when present, so attaching a managed Postgres on Render needs
# no other settings changes.
DATABASE_URL = os.getenv('DATABASE_URL', '')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
elif USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            # Wraps django.db.backends.mysql to accept MariaDB 10.4 (see
            # dbcompat/mariadb_compat/base.py for why).
            'ENGINE': 'dbcompat.mariadb_compat',
            'NAME': os.getenv('MYSQL_DATABASE', 'kag_unity_pwa'),
            'USER': os.getenv('MYSQL_USER', 'root'),
            'PASSWORD': os.getenv('MYSQL_PASSWORD', ''),
            'HOST': os.getenv('MYSQL_HOST', '127.0.0.1'),
            'PORT': os.getenv('MYSQL_PORT', '3306'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Compresses + content-hashes static files at collectstatic time and lets
# WhiteNoiseMiddleware serve them with far-future cache headers - only
# takes effect where whitenoise is actually in MIDDLEWARE (the Docker
# deployment); harmless no-op otherwise.
#
# Uploaded media (profile pictures, gallery photos, announcement posters)
# needs storage that survives a redeploy - most PaaS free tiers (Render
# included) have no persistent disk, so local FileSystemStorage would lose
# every upload on the next deploy/restart. When CLOUDINARY_URL is set,
# media is stored on Cloudinary's free tier instead; unset (local dev,
# cPanel with real disk) keeps the existing filesystem behavior unchanged.
CLOUDINARY_URL = os.getenv('CLOUDINARY_URL', '')

STORAGES = {
    'default': {
        'BACKEND': (
            'cloudinary_storage.storage.MediaCloudinaryStorage'
            if CLOUDINARY_URL else 'django.core.files.storage.FileSystemStorage'
        ),
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'api.authentication.ApprovedJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    # Baseline rate limiting for every endpoint, plus tighter per-endpoint
    # scopes (applied via `throttle_classes = [ScopedRateThrottle]` +
    # `throttle_scope = '...'` on the view) for the handful of endpoints
    # that are actually worth brute-forcing: login, registration, Google
    # sign-in, and the password-reset OTP flow.
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'user': '300/minute',
        'login': '10/minute',
        'register': '10/hour',
        'otp': '5/hour',
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split()

# Needed for the Django admin's session/CSRF cookies and login form to work
# at all over HTTPS on a real domain - unset by default so a bare
# `python manage.py runserver` deploy doesn't need it. Empty in dev (no-op).
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', '').split()

# Render (like Heroku/Railway/most PaaS platforms) terminates HTTPS at its
# own proxy and forwards plain HTTP internally, with X-Forwarded-Proto
# telling the app what the original request actually was. Without this,
# Django can't tell the request was HTTPS, so SECURE_SSL_REDIRECT below
# "helpfully" redirects it to HTTPS again - which the proxy then forwards
# as HTTP again - forever. No effect for the cPanel path (Apache terminates
# TLS itself, doesn't proxy over plain HTTP) or local dev (header absent).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- Production security hardening ---
# All gated on DEBUG so the local dev server (plain HTTP, DEBUG=True)
# keeps working unchanged; every one of these is a no-op until the real
# deployment sets DJANGO_DEBUG=False.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'

    # HTTP Strict Transport Security is opt-in and off by default (0) even
    # in production - it tells browsers to refuse plain HTTP for this
    # domain for the given duration, with no way to undo that early from
    # the server side if HTTPS turns out to be broken somewhere (e.g. a
    # subdomain AutoSSL hasn't finished issuing for yet). Only set
    # DJANGO_HSTS_SECONDS once every domain in use is confirmed working
    # over HTTPS.
    SECURE_HSTS_SECONDS = int(os.getenv('DJANGO_HSTS_SECONDS', '0'))
    if SECURE_HSTS_SECONDS:
        SECURE_HSTS_INCLUDE_SUBDOMAINS = True
        SECURE_HSTS_PRELOAD = True

AUTH_USER_MODEL = 'auth.User'

EMAIL_HOST = os.getenv('EMAIL_HOST', '')
if EMAIL_HOST:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
else:
    # No SMTP configured — print emails to the console instead of silently
    # dropping them, so OTP codes are still visible during development.
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'no-reply@church.local')
