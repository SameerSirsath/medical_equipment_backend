import requests
import functools
import logging

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
    if ip.startswith('172.16.') or ip.startswith('172.17.') or ip.startswith('172.18.') or ip.startswith('172.19.') or ip.startswith('172.20.') or ip.startswith('172.21.') or ip.startswith('172.22.') or ip.startswith('172.23.') or ip.startswith('172.24.') or ip.startswith('172.25.') or ip.startswith('172.26.') or ip.startswith('172.27.') or ip.startswith('172.28.') or ip.startswith('172.29.') or ip.startswith('172.30.') or ip.startswith('172.31.'):
        return True
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
            logging.warning(f"ip-api.com failed for {ip}: {data.get('message')}")
    except Exception as e:
        logging.warning(f"ip-api.com error for {ip}: {e}")

    # Optional fallback (uncomment if you have a token)
    # try:
    #     token = "YOUR_IPINFO_TOKEN"
    #     url = f"https://ipinfo.io/{ip}/json?token={token}"
    #     resp = requests.get(url, timeout=3)
    #     data = resp.json()
    #     if 'city' in data:
    #         loc = data.get('loc', '').split(',')
    #         lat = float(loc[0]) if len(loc) > 0 else None
    #         lon = float(loc[1]) if len(loc) > 1 else None
    #         return data.get('city'), data.get('country'), lat, lon
    # except Exception as e:
    #     logging.warning(f"ipinfo.io error for {ip}: {e}")

    return None, None, None, None