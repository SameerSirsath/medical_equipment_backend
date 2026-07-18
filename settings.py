# settings.py
import os

ssl_enabled = os.getenv('DB_SSL', 'false').lower() == 'true'
# For cloud MySQL (Railway, PlanetScale, etc.), use {'ssl': {}} to enable SSL without cert verification
# For local/dev, use None
ssl_config = {'ssl': {}} if ssl_enabled else None

DB_CONFIG = {
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'medical_equipment'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'charset': 'utf8mb4',
    'ssl': ssl_config,
    'connect_timeout': 10,
}
# Remove None ssl key
DB_CONFIG = {k: v for k, v in DB_CONFIG.items() if v is not None}