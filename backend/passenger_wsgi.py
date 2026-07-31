"""Entry point cPanel's "Setup Python App" (Phusion Passenger) looks for.
Passenger imports this module and calls the `application` callable it
finds - everything else is the same WSGI app manage.py/gunicorn would use."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from backend.wsgi import application  # noqa: E402,F401
