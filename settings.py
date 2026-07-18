# settings.py
import os

DB_CONFIG = {
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'medical_equipment'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'charset': 'utf8mb4'
}