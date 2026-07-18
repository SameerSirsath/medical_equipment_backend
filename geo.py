import requests
import functools
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Extract real client IP from Flask request (always returns a string)."""
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        ip = forwarded.split(',')[0].strip()
    else:
        ip = request.remote_addr
    return ip  # always return, even if private

def is_private_ip(ip):
    """Return True if IP is private/local."""
    if not ip:
        return True
    # IPv4 private ranges
    if ip.startswith('127.') or ip.startswith('192.168.') or ip.startswith('10.'):
        return True
    if ip.startswith('172.'):
        # 172.16.0.0/12
        parts = ip.split('.')
        if len(parts) >= 2:
            try:
                second = int(parts[1])
                if 16 <= second <= 31:
                    return True
            except ValueError:
                pass
    # IPv6 localhost
    if ip == '::1':
        return True
    return False

@functools.lru_cache(maxsize=1000)
def get_geolocation(ip):
    """Return (city, country, lat, lon) for public IPs; for private IPs return None."""
    if not ip or is_private_ip(ip):
        return None, None, None, None

    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,message,city,country,lat,lon"
        resp = requests.get(url, timeout=3)
        data = resp.json()
        if data.get('status') == 'success':
            return data.get('city'), data.get('country'), data.get('lat'), data.get('lon')
        else:
            logger.warning(f"ip-api.com failed for {ip}: {data.get('message')}")
    except Exception as e:
        logger.warning(f"ip-api.com error for {ip}: {e}")

    return None, None, None, None