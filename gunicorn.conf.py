import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 120   # seconds, give LLM enough time
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 100
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"