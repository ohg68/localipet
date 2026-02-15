from .base import *  # noqa: F401, F403

DEBUG = False

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Sentry
import sentry_sdk

sentry_sdk.init(
    dsn=env("SENTRY_DSN", default=""),  # noqa: F405
    traces_sample_rate=0.1,
)
