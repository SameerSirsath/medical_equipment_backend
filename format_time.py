# format_time.py
from datetime import datetime

def format_ist(dt):
    """
    Format a datetime object (assumed to be in IST) as DD/MM/YYYY, HH:MM:SS.
    Returns empty string if dt is None or not a datetime.
    """
    if dt is None or not isinstance(dt, datetime):
        return ''
    return dt.strftime('%d/%m/%Y, %H:%M:%S')

