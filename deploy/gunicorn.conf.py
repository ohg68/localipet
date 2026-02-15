"""Gunicorn configuration for Localipet production deployment."""

import multiprocessing

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads = 4
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = (
    '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
)

# Process naming
proc_name = "localipet"

# Security
limit_request_line = 8190
limit_request_fields = 100
limit_request_field_size = 8190

# Preload app for faster worker startup
preload_app = True

# Restart workers on code change (dev only)
# reload = True
