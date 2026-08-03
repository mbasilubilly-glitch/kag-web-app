"""Standalone DB connection helper for scripts run outside Django's ORM.

Reads the same environment variables as backend/backend/settings.py, so it
targets whichever database the Django app is currently configured for
(SQLite locally when DJANGO_USE_SQLITE=True, MariaDB/MySQL otherwise).

Usage:
    from db import get_connection

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM auth_user")
    rows = cur.fetchall()
    conn.close()
"""
import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
USE_SQLITE = os.getenv('DJANGO_USE_SQLITE', 'False') == 'True'


def get_connection():
    if USE_SQLITE:
        return sqlite3.connect(BASE_DIR / 'db.sqlite3')

    import MySQLdb

    return MySQLdb.connect(
        db=os.getenv('MYSQL_DATABASE', 'kag_unity_pwa'),
        user=os.getenv('MYSQL_USER', 'root'),
        passwd=os.getenv('MYSQL_PASSWORD', ''),
        host=os.getenv('MYSQL_HOST', '127.0.0.1'),
        port=int(os.getenv('MYSQL_PORT', '3306')),
    )
