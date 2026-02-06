"""
Pytest configuration for running tests with SQLite (no PostgreSQL needed).
"""
import os
import sys

# Add core directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'core'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Override database settings before Django setup
import django
from django.conf import settings

# Must set before setup
os.environ['DATABASE_URL'] = 'sqlite:///test.db'


def pytest_configure(config):
    """Override Django settings for tests."""
    settings.DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
