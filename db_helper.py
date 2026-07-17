import pymysql
import re
from settings import DB_CONFIG
import uuid
from datetime import datetime as dt, timedelta   # <-- renamed import
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import bcrypt
import hashlib
import random
import string
import json
from format_time import format_ist
load_dotenv()

ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY environment variable is not set.")
cipher = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(plaintext: str) -> str:
    if plaintext is None or plaintext == '':
        return ''
    return cipher.encrypt(plaintext.encode()).decode()

def decrypt_data(ciphertext: str) -> str:
    if ciphertext is None or ciphertext == '':
        return ''
    try:
        return cipher.decrypt(ciphertext.encode()).decode()
    except Exception:
        return ciphertext

def hash_value(value: str) -> str:
    """Return SHA256 hex digest for deterministic lookup."""
    return hashlib.sha256(value.encode()).hexdigest()


# ---------- Formatting Helpers ----------
def format_list_field(text):
    if not text:
        return "Not available."
    items = re.split(r'[;\n]+', text)
    items = [item.strip() for item in items if item.strip()]
    if not items:
        return text.strip()
    return "\n".join(f"{i+1}. {item}" for i, item in enumerate(items))

def format_directions(text):
    if not text:
        return "Not available."
    if re.search(r'^\s*\d+\.', text, re.MULTILINE):
        return text.strip()
    lines = re.split(r'[;\n]+', text)
    lines = [line.strip() for line in lines if line.strip()]
    if len(lines) > 1:
        return "\n".join(f"{i+1}. {line}" for i, line in enumerate(lines))
    else:
        return text.strip()


# ---------- Database Retrieval ----------
def get_product_context(product_id):
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM equipment WHERE equipment_id = %s", (product_id,))
            product = cursor.fetchone()
            if not product:
                return None

            list_fields = ['features', 'uses', 'advantages', 'disadvantages',
                           'accessories', 'applications', 'safety_features']
            for field in list_fields:
                if field in product and product[field]:
                    product[field] = format_list_field(product[field])

            if 'use_directions' in product and product['use_directions']:
                product['use_directions'] = format_directions(product['use_directions'])

            cursor.execute("""
                SELECT c.name 
                FROM category c
                JOIN equipment_category ec ON c.category_id = ec.category_id
                WHERE ec.equipment_id = %s
            """, (product_id,))
            categories = cursor.fetchall()
            product['categories'] = [cat['name'] for cat in categories]

            for key in ['description', 'detailed_description', 'technical_specifications']:
                if key in product and product[key] and len(str(product[key])) > 800:
                    product[key] = str(product[key])[:800] + "... (truncated)"

            return product
    finally:
        conn.close()

def get_all_categories():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM category ORDER BY name")
            return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()

def get_products_by_category(category_name):
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT e.equipment_id, e.name
                FROM equipment e
                JOIN category c ON e.category_id = c.category_id
                WHERE c.name = %s
                ORDER BY e.name
            """, (category_name,))
            return cursor.fetchall()
    finally:
        conn.close()


# ---------- Inquiry Storage ----------
def save_inquiry(name, email, contact, product_id, product_name, category,
                 inquiry_type='quote', requirements='', user_id=None):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            enc_name = encrypt_data(name)
            enc_email = encrypt_data(email)
            enc_contact = encrypt_data(contact)
            email_hash = hash_value(email) if email else None
            contact_hash = hash_value(contact) if contact else None

            sql = """
                INSERT INTO inquiries
                (name, email, contact, device_id, device_name, category,
                 inquiry_type, status, requirements, created_at,
                 email_hash, contact_hash, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s, NOW(), %s, %s, %s)
            """
            cursor.execute(sql, (enc_name, enc_email, enc_contact,
                                 product_id, product_name, category,
                                 inquiry_type, requirements,
                                 email_hash, contact_hash, user_id))
            conn.commit()
            return cursor.lastrowid
    finally:
        conn.close()

# ---------- Session Management ----------
def upsert_session(session_id, ip, city, country, lat, lon, user_agent, user_id=None):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT session_id FROM user_session WHERE session_id = %s", (session_id,))
            exists = cursor.fetchone()
            if exists:
                if user_id is not None:
                    cursor.execute(
                        "UPDATE user_session SET last_activity = %s, user_id = %s WHERE session_id = %s",
                        (dt.now(), user_id, session_id)
                    )
                else:
                    cursor.execute(
                        "UPDATE user_session SET last_activity = %s WHERE session_id = %s",
                        (dt.now(), session_id)
                    )
            else:
                cursor.execute(
                    """INSERT INTO user_session 
                       (session_id, ip_address, city, country, latitude, longitude, user_agent, user_id, first_visit, last_activity)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (session_id, ip, city, country, lat, lon, user_agent, user_id, dt.now(), dt.now())
                )
            conn.commit()
    finally:
        conn.close()

def link_session_to_user(session_id: str, user_id: int):
    """Update user_session with user_id."""
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE user_session SET user_id = %s WHERE session_id = %s",
                (user_id, session_id)
            )
            conn.commit()
    finally:
        conn.close()


# ---------- Chat History ----------
def log_chat_message(session_id, product_id, user_msg, bot_msg, user_id=None):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            enc_user = encrypt_data(user_msg)
            enc_bot = encrypt_data(bot_msg)
            cursor.execute(
                """INSERT INTO chat_history 
                   (session_id, product_id, user_message, bot_response, timestamp, user_id)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (session_id, product_id, enc_user, enc_bot, dt.now(), user_id)
            )
            conn.commit()
    finally:
        conn.close()

def get_chat_history(user_id, limit=20):
    """(Legacy) Retrieve chat history for a user across all time."""
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT user_message, bot_response
                   FROM chat_history
                   WHERE user_id = %s
                   ORDER BY timestamp DESC
                   LIMIT %s""",
                (user_id, limit)
            )
            rows = cursor.fetchall()
            history = []
            for row in reversed(rows):
                user_msg = decrypt_data(row['user_message'])
                bot_msg = decrypt_data(row['bot_response'])
                history.append({'user': user_msg, 'assistant': bot_msg})
            return history
    finally:
        conn.close()
def get_todays_chat_history(user_id: int, limit: int = 100):
    """
    Fetch all chat history for a specific user (no time filter).
    Returns list of dicts with product_name, timestamp, user_message, bot_response.
    """
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.name AS product_name,
                    ch.timestamp,
                    ch.user_message,
                    ch.bot_response
                FROM chat_history ch
                JOIN equipment e ON ch.product_id = e.equipment_id
                WHERE ch.user_id = %s
                ORDER BY ch.timestamp DESC
                LIMIT %s
            """, (user_id, limit))
            rows = cursor.fetchall()
            for row in rows:
                row['user_message'] = decrypt_data(row['user_message'])
                row['bot_response'] = decrypt_data(row['bot_response'])
                if row.get('timestamp'):
                    row['timestamp_ist'] = format_ist(row['timestamp'])
                else:
                    row['timestamp_ist'] = ''
            return rows
    finally:
        conn.close()
def delete_old_chat_history(days=4):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            sql = "DELETE FROM chat_history WHERE timestamp < NOW() - INTERVAL %s DAY"
            cursor.execute(sql, (days,))
            deleted = cursor.rowcount
            conn.commit()
            return deleted
    finally:
        conn.close()

def delete_old_sessions(days=4):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            sql = "DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL %s DAY"
            cursor.execute(sql, (days,))
            deleted = cursor.rowcount
            conn.commit()
            return deleted
    finally:
        conn.close()


def save_cookie_consent(session_id, status, preferences):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO cookie_consent (session_id, consent_status, preferences, consent_timestamp)
                VALUES (%s, %s, %s, NOW())
            """
            cursor.execute(sql, (session_id, status, json.dumps(preferences)))
            conn.commit()
    finally:
        conn.close()




def create_user(username: str, email: str, phone: str, password: str) -> int:
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            enc_email = encrypt_data(email)
            enc_phone = encrypt_data(phone)
            email_hash = hash_value(email)
            phone_hash = hash_value(phone)
            sql = """
                INSERT INTO users 
                (username, email_encrypted, email_hash, phone_encrypted, phone_hash, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (username, enc_email, email_hash, enc_phone, phone_hash, password_hash))
            conn.commit()
            return cursor.lastrowid
    finally:
        conn.close()

def find_user_by_contact(contact: str):
    contact_hash = hash_value(contact)
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email_hash = %s", (contact_hash,))
            user = cursor.fetchone()
            if not user:
                cursor.execute("SELECT * FROM users WHERE phone_hash = %s", (contact_hash,))
                user = cursor.fetchone()
            if user:
                user['email'] = decrypt_data(user['email_encrypted'])
                user['phone'] = decrypt_data(user['phone_encrypted'])
                del user['email_encrypted']
                del user['phone_encrypted']
            return user
    finally:
        conn.close()

def verify_password(user: dict, plain_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), user['password_hash'].encode())

def get_user_from_session(session_id: str):
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.* FROM users u
                JOIN user_session s ON s.user_id = u.id
                WHERE s.session_id = %s
            """, (session_id,))
            user = cursor.fetchone()
            if user:
                user['email'] = decrypt_data(user['email_encrypted'])
                user['phone'] = decrypt_data(user['phone_encrypted'])
                del user['email_encrypted']
                del user['phone_encrypted']
            return user
    finally:
        conn.close()

def mark_user_verified(user_id: int):
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET is_verified = TRUE WHERE id = %s", (user_id,))
            conn.commit()
    finally:
        conn.close()

def generate_otp(session_id: str, contact_type: str, contact: str) -> str:
    otp_code = ''.join(random.choices(string.digits, k=6))
    expires_at = dt.now() + timedelta(minutes=5)
    enc_contact = encrypt_data(contact)
    contact_hash = hash_value(contact)
    enc_otp = encrypt_data(otp_code)
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM otp_verifications WHERE session_id = %s AND contact_hash = %s AND verified = FALSE",
                (session_id, contact_hash)
            )
            sql = """
                INSERT INTO otp_verifications 
                (session_id, contact_type, contact_encrypted, contact_hash, otp_code_encrypted, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (session_id, contact_type, enc_contact, contact_hash, enc_otp, expires_at))
            conn.commit()
    finally:
        conn.close()
    return otp_code

def verify_otp(session_id: str, contact: str, otp_input: str) -> bool:
    contact_hash = hash_value(contact)
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, otp_code_encrypted, expires_at, attempts 
                FROM otp_verifications 
                WHERE session_id = %s AND contact_hash = %s AND verified = FALSE
                ORDER BY created_at DESC LIMIT 1
                """,
                (session_id, contact_hash)
            )
            record = cursor.fetchone()
            if not record:
                return False
            if dt.now() > record['expires_at']:
                return False
            if record['attempts'] >= 3:
                return False
            stored_otp = decrypt_data(record['otp_code_encrypted'])
            if stored_otp != otp_input:
                cursor.execute(
                    "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = %s",
                    (record['id'],)
                )
                conn.commit()
                return False
            cursor.execute(
                "UPDATE otp_verifications SET verified = TRUE WHERE id = %s",
                (record['id'],)
            )
            conn.commit()
            return True
    finally:
        conn.close()

def is_contact_verified(session_id: str, contact: str) -> bool:
    contact_hash = hash_value(contact)
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM otp_verifications WHERE session_id = %s AND contact_hash = %s AND verified = TRUE",
                (session_id, contact_hash)
            )
            return cursor.fetchone() is not None
    finally:
        conn.close()



def has_existing_inquiry(email: str, contact: str, product_id: int, days: int = 30) -> bool:
    if not email and not contact:
        return False
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            conditions = []
            params = [product_id, days]
            if email:
                conditions.append("email_hash = %s")
                params.append(hash_value(email))
            if contact:
                conditions.append("contact_hash = %s")
                params.append(hash_value(contact))
            if not conditions:
                return False
            sql = f"""
                SELECT id FROM inquiries 
                WHERE device_id = %s 
                AND created_at > NOW() - INTERVAL %s DAY
                AND ({' OR '.join(conditions)})
            """
            cursor.execute(sql, params)
            return cursor.fetchone() is not None
    finally:
        conn.close()

def has_today_inquiry(email: str, contact: str) -> bool:
    """
    Check if there is an inquiry from this user (by email or phone) today.
    Returns True if found (i.e., daily limit reached).
    """
    if not email and not contact:
        return False
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            conditions = []
            params = []
            if email:
                conditions.append("email_hash = %s")
                params.append(hash_value(email))
            if contact:
                conditions.append("contact_hash = %s")
                params.append(hash_value(contact))
            if not conditions:
                return False
            sql = f"""
                SELECT id FROM inquiries 
                WHERE DATE(created_at) = CURDATE()
                AND ({' OR '.join(conditions)})
            """
            cursor.execute(sql, params)
            return cursor.fetchone() is not None
    finally:
        conn.close()

# (Legacy) keep old function if needed
def has_daily_inquiry(email: str, contact: str, hours: int = 24):
    # This is kept for backward compatibility; you may remove it if you prefer.
    return False

def get_user_chat_history(user_id: int, limit: int = 50):
    # Legacy all-time history – kept for reference
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.name AS product_name,
                    ch.timestamp,
                    ch.user_message,
                    ch.bot_response
                FROM chat_history ch
                JOIN equipment e ON ch.product_id = e.equipment_id
                WHERE ch.user_id = %s
                ORDER BY ch.timestamp DESC
                LIMIT %s
            """, (user_id, limit))
            rows = cursor.fetchall()
            for row in rows:
                row['user_message'] = decrypt_data(row['user_message'])
                row['bot_response'] = decrypt_data(row['bot_response'])
            return rows
    finally:
        conn.close()

def get_user_inquiries(user_id: int, limit: int = 50):
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id,
                    device_name AS product_name,
                    category,
                    inquiry_type,
                    status,
                    created_at,
                    requirements
                FROM inquiries
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, limit))
            rows = cursor.fetchall()
            # Convert created_at to IST string and add as new field
            for row in rows:
                if row.get('created_at'):
                    row['created_at_ist'] = format_ist(row['created_at'])
                else:
                    row['created_at_ist'] = ''
            return rows
    finally:
        conn.close()

def find_user_by_username(username: str):
    """Return user if username exists, else None."""
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            return cursor.fetchone()
    finally:
        conn.close()

def find_user_by_email(email: str):
    """Return user if email exists, else None."""
    email_hash = hash_value(email)
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email_hash = %s", (email_hash,))
            return cursor.fetchone()
    finally:
        conn.close()

def find_user_by_phone(phone: str):
    """Return user if phone exists, else None."""
    phone_hash = hash_value(phone)
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE phone_hash = %s", (phone_hash,))
            return cursor.fetchone()
    finally:
        conn.close()