from flask import Flask, request, jsonify, render_template, session, abort, send_from_directory
from db_helper import (
    get_all_categories,
    get_products_by_category,
    get_product_context,
    save_inquiry,
    delete_old_chat_history,
    save_cookie_consent,
    get_chat_history,
    log_chat_message,
    upsert_session,
    link_session_to_user,
    get_user_from_session,
    create_user,
    find_user_by_contact,
    verify_password,
    generate_otp,
    verify_otp,
    is_contact_verified,
    mark_user_verified,
    has_existing_inquiry,
    get_user_inquiries,
    has_today_inquiry,
    get_todays_chat_history,
    find_user_by_username,
    find_user_by_email,
    find_user_by_phone,
    DB_CONFIG
)
from email_utils import send_otp_email
from agent import ask_agent
import re
import os
import uuid
import pymysql          # added for feedback route
import google.generativeai as genai

from geo import get_client_ip, get_geolocation, is_private_ip
from datetime import timedelta

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_COOKIE_NAME'] = 'session'

# ---------- Load About KAIZY info ----------
ABOUT_FILE = os.path.join(os.path.dirname(__file__), 'about_kaizy.txt')
try:
    with open(ABOUT_FILE, 'r', encoding='utf-8') as f:
        ABOUT_KAIZY = f.read()
        print("✅ About KAIZY information loaded successfully.")
except FileNotFoundError:
    print(f"❌ File not found: {ABOUT_FILE}")
    ABOUT_KAIZY = "KAIZY is a medical equipment assistant. For more information, please contact support."
except Exception as e:
    print(f"❌ Error reading file: {e}")
    ABOUT_KAIZY = "KAIZY is a medical equipment assistant. For more information, please contact support."

# ---------- Contact Info from Environment ----------
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "sales@kaizenmeds.com")
CONTACT_PHONE = os.getenv("CONTACT_PHONE", "+91 966 550 2190")
CONTACT_WEBSITE = os.getenv("CONTACT_WEBSITE", "kaizy.com")

# ---------- Service-related keywords ----------
SERVICE_KEYWORDS = [
    'repair', 'maintenance', 'servicing', 'fix', 'broken', 'malfunction',
    'troubleshoot', 'troubleshooting', 'installation', 'setup',
    'damaged', 'faulty', 'not working', 'doesn\'t work'
]

# ---------- Helper: Select relevant product fields ----------
def get_relevant_fields(user_question: str, product_data: dict) -> dict:
    question_lower = user_question.lower()
    relevant = {}
    relevant['name'] = product_data.get('name', '')
    relevant['description'] = product_data.get('description', '')
    if any(word in question_lower for word in ['feature', 'capability', 'function']):
        relevant['features'] = product_data.get('features', '')
    if any(word in question_lower for word in ['use', 'application', 'used for', 'purpose']):
        relevant['uses'] = product_data.get('uses', '')
        relevant['applications'] = product_data.get('applications', '')
    if any(word in question_lower for word in ['spec', 'technical', 'specification', 'detail']):
        relevant['technical_specifications'] = product_data.get('technical_specifications', '')
    if any(word in question_lower for word in ['price', 'cost', 'pricing', 'quote', 'budget']):
        relevant['price'] = product_data.get('price', '')
    if any(word in question_lower for word in ['advantage', 'benefit', 'pro', 'better']):
        relevant['advantages'] = product_data.get('advantages', '')
    if any(word in question_lower for word in ['disadvantage', 'drawback', 'con', 'limitation']):
        relevant['disadvantages'] = product_data.get('disadvantages', '')
    if any(word in question_lower for word in ['warranty', 'guarantee', 'cover']):
        relevant['warranty'] = product_data.get('warranty', '')
    if any(word in question_lower for word in ['maintenance', 'service', 'repair', 'install']):
        relevant['maintenance'] = product_data.get('maintenance', '')
        relevant['use_directions'] = product_data.get('use_directions', '')
    if any(word in question_lower for word in ['safety', 'secure', 'safe']):
        relevant['safety_features'] = product_data.get('safety_features', '')
    if any(word in question_lower for word in ['accessory', 'include', 'bundle']):
        relevant['accessories'] = product_data.get('accessories', '')
    if len(relevant) <= 2:
        extra = ['features', 'uses', 'technical_specifications', 'price', 'warranty']
        for field in extra:
            if product_data.get(field):
                relevant[field] = product_data.get(field)
    return relevant

# ---------- Prompt Builder ----------
def build_chat_prompt(user_question, product_context, product_name, category_name, history):
    relevant_data = get_relevant_fields(user_question, product_context)
    context_lines = []
    for key, value in relevant_data.items():
        if value:
            field_name = key.replace('_', ' ').title()
            context_lines.append(f"{field_name}: {value}")
    context_str = "\n".join(context_lines)

    system_msg = (
        "You are KAIZY, a concise and polite assistant for medical equipment. "
        "Answer the user's question using ONLY the product information provided below. "
        "Keep your answer as short as possible – ideally 1–2 sentences, or a brief bulleted list if needed. "
        "Do not repeat the question or add extra commentary. "
        "If the information is not in the provided data, say: 'I don't have that information. Please contact our support team.' "
        "Use HTML formatting only when necessary (e.g., <ul>, <li>, <b>). "
        "Do not use Markdown. "
        "Always be polite, professional, and helpful. Use courteous language such as 'please', 'thank you', and 'I'd be happy to assist'. "
        "Never repeat or restate the user’s question in your response. Only provide direct answers or polite refusals. "
        "If the user requests a quotation, pricing, or asks to speak to a representative, respond with a polite message acknowledging their request. "
        "For example: 'Thank you for your interest. I have raised an inquiry for you. Our team will contact you shortly with the details.' "
        "Do not add any extra technical details or commentary in that case."
    )

    contact_block = f"Contact: {CONTACT_EMAIL}, {CONTACT_PHONE}"
    about_block = f"About: {ABOUT_KAIZY}"

    conversation = []
    conversation.append(f"System: {system_msg}")
    conversation.append(f"Context:\n{context_str}")
    conversation.append(contact_block)
    conversation.append(about_block)
    for turn in history:
        conversation.append(f"User: {turn['user']}")
        conversation.append(f"Assistant: {turn['assistant']}")
    conversation.append(f"User: {user_question}")
    conversation.append("Assistant:")

    return "\n\n".join(conversation)

def clean_response(text: str) -> str:
    if not text:
        return text
    text = re.sub(r'\s*\*\s*\*\s*\*\s*', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# ---------- Routes ----------
@app.route('/accept_terms', methods=['POST'])
def accept_terms():
    session['terms_accepted'] = True
    return jsonify({'success': True})

@app.route('/terms')
def terms_page():
    return render_template('terms.html')

@app.route('/cookies')
def cookies_page():
    return render_template('cookies.html')

@app.route('/privacy')
def privacy_page():
    return render_template('privacy.html')

# ---- REMOVED the old index route to avoid conflict with React serving ----
# @app.route('/')
# def index(): ...  (commented out)

# ==================== API ROUTES ====================

@app.route('/api/categories', methods=['GET'])
def api_categories():
    categories = get_all_categories()
    return jsonify({'categories': categories})

@app.route('/api/products/<category_name>', methods=['GET'])
def api_products(category_name):
    products = get_products_by_category(category_name)
    return jsonify({'category': category_name, 'products': products})

@app.route('/api/bootstrap', methods=['GET'])
def api_bootstrap():
    categories = get_all_categories()
    products_by_category = {}
    for cat in categories:
        products_by_category[cat] = get_products_by_category(cat)
    return jsonify({
        'categories': categories,
        'products_by_category': products_by_category
    })

@app.route('/api/check-user', methods=['POST'])
def check_user():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    
    response = {}
    if username:
        response['username_exists'] = find_user_by_username(username) is not None
    if email:
        response['email_exists'] = find_user_by_email(email) is not None
    if phone:
        response['phone_exists'] = find_user_by_phone(phone) is not None
    
    return jsonify(response)

# ==================== FEEDBACK ROUTE ====================
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON payload'}), 400

    rating = data.get('rating')
    comment = data.get('comment', '').strip()
    feedback_type = data.get('type', 'general')
    product_id = data.get('product_id')  # may be None

    # Validation
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be an integer between 1 and 5'}), 400

    if feedback_type not in ('general', 'product', 'service', 'chat_experience'):
        return jsonify({'error': 'Invalid feedback type'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    # Get user if logged in
    user = get_user_from_session(session_id)
    user_id = user['id'] if user else None

    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO feedback (session_id, user_id, product_id, rating, comment, feedback_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (session_id, user_id, product_id, rating, comment, feedback_type))
            conn.commit()
        return jsonify({'success': True, 'message': 'Thank you for your feedback!'})
    except Exception as e:
        app.logger.error(f"Feedback submission error: {e}")
        return jsonify({'error': 'Failed to save feedback'}), 500
    finally:
        conn.close()

# ==================== CHAT ROUTE ====================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    product_id = data.get('product_id')
    category = data.get('category', '')

    if not user_message or not product_id:
        return jsonify({'error': 'Missing message or product ID'}), 400

    product_context = get_product_context(product_id)
    if not product_context:
        return jsonify({'error': 'Product not found'}), 404

    product_name = product_context.get('name', 'Unknown')
    session['product_id'] = product_id

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    user = get_user_from_session(session_id)
    user_id = user['id'] if user else None

    user_lower = user_message.lower()

    # Service-related detection
    if any(kw in user_lower for kw in SERVICE_KEYWORDS):
        response_text = (
            "I understand you have a service-related query. "
            "While I specialize in providing information about medical devices and their features, "
            "I will connect you with our support team who can assist with repairs, maintenance, warranty claims, and installation. "
            "Please reach out to us directly at {CONTACT_EMAIL} or {CONTACT_PHONE}, and our team will be happy to help you promptly."
        )
        log_chat_message(
            session_id=session_id,
            product_id=product_id,
            user_msg=user_message,
            bot_msg=response_text,
            user_id=user_id
        )
        return jsonify({
            'response': response_text,
            'show_inquiry_modal': False,
            'product_id': product_id,
            'product_name': product_name,
            'category': category
        })

    # Normal LLM flow – use user_id for history (FIXED)
    history = get_chat_history(user_id, limit=10) if user_id else []
    enhanced_prompt = build_chat_prompt(
        user_message,
        product_context,
        product_name,
        category,
        history
    )

    quote_keywords = ['quote', 'quotation', 'price quote', 'get a quote',
                      'request a quote', 'pricing', 'cost', 'how much',
                      'sales', 'speak to a representative']
    is_inquiry = any(kw in user_lower for kw in quote_keywords)

    try:
        raw_answer = ask_agent(enhanced_prompt)
        cleaned_answer = clean_response(raw_answer)
    except Exception as e:
        return jsonify({'error': f'Agent error: {str(e)}'}), 500

    log_chat_message(
        session_id=session_id,
        product_id=product_id,
        user_msg=user_message,
        bot_msg=cleaned_answer,
        user_id=user_id
    )

    return jsonify({
        'response': cleaned_answer,
        'show_inquiry_modal': is_inquiry,
        'product_id': product_id,
        'product_name': product_name,
        'category': category
    })

# ========================= AUTHENTICATION ROUTES =========================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    otp_code = data.get('otp', '').strip()

    if not all([username, email, phone, password, otp_code]):
        return jsonify({'error': 'All fields and OTP are required'}), 400

    if find_user_by_contact(email) or find_user_by_contact(phone):
        return jsonify({'error': 'Email or phone already registered'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    if not verify_otp(session_id, email, otp_code):
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    try:
        user_id = create_user(username, email, phone, password)
        link_session_to_user(session_id, user_id)
        mark_user_verified(user_id)
        return jsonify({'success': True, 'message': 'User registered successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    contact = data.get('contact', '').strip()
    password = data.get('password', '')

    if not contact or not password:
        return jsonify({'error': 'Contact and password required'}), 400

    user = find_user_by_contact(contact)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if not verify_password(user, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    session_id = session.get('session_id')
    if session_id:
        link_session_to_user(session_id, user['id'])

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'phone': user['phone']
        }
    })

# ==================== OTP GENERATION (with email sending) ====================
@app.route('/api/generate-otp', methods=['POST'])
def generate_otp_route():
    data = request.get_json()
    contact = data.get('contact', '').strip()
    contact_type = data.get('type', 'email')

    if not contact:
        return jsonify({'error': 'Contact is required'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    if contact_type == 'email' and '@' not in contact:
        return jsonify({'error': 'Invalid email'}), 400
    if contact_type == 'phone' and not contact.isdigit():
        return jsonify({'error': 'Invalid phone number'}), 400

    # Generate OTP and store it
    otp = generate_otp(session_id, contact_type, contact)
    print(f"🔐 OTP for {contact}: {otp}")

    # ── Send email if type is email ──────────────────────────────────
    if contact_type == 'email':
        try:
            send_otp_email(contact, otp)
            print(f"✅ OTP email sent to {contact}")
        except Exception as e:
            app.logger.error(f"Failed to send OTP email: {e}")
            return jsonify({'error': 'Failed to send OTP email. Check SMTP settings.'}), 500

    return jsonify({'success': True, 'message': 'OTP sent'})

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp_route():
    data = request.get_json()
    contact = data.get('contact', '').strip()
    otp_code = data.get('otp', '').strip()

    if not contact or not otp_code:
        return jsonify({'error': 'Contact and OTP required'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    if verify_otp(session_id, contact, otp_code):
        return jsonify({'success': True, 'message': 'OTP verified'})
    else:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

# ========================= INQUIRY ROUTE =========================
@app.route('/inquiry', methods=['POST'])
def inquiry():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    contact = data.get('contact', '').strip()
    product_id = data.get('product_id')
    product_name = data.get('product_name', '')
    category = data.get('category', '')
    inquiry_type = data.get('inquiry_type', 'quote')
    requirements = data.get('requirements', '')

    if inquiry_type == 'quote':
        requirements = 'Quotation'

    if not name or not email or not contact or not product_id:
        return jsonify({'error': 'Missing required fields'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    user = get_user_from_session(session_id)
    user_id = user['id'] if user else None

    if has_existing_inquiry(email, contact, product_id, days=30):
        return jsonify({
            'error': 'Quotation request for this device is already submitted. Our team will reach out to you regarding this.'
        }), 409

    if has_today_inquiry(email, contact):
        return jsonify({'error': 'It looks like you’ve already submitted an inquiry today. To ensure we can give each request the attention it deserves, please try again tomorrow. Thank you for your understanding.'}), 429

    if not user:
        if not is_contact_verified(session_id, email) and not is_contact_verified(session_id, contact):
            return jsonify({'error': 'Please verify your contact via OTP before submitting inquiry.'}), 403

    try:
        inquiry_id = save_inquiry(
            name, email, contact, product_id, product_name,
            category, inquiry_type, requirements, user_id
            
        )
        return jsonify({'success': True, 'inquiry_id': inquiry_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========================= OTP LOGIN ROUTES =========================
@app.route('/api/send-login-otp', methods=['POST'])
def send_login_otp():
    """Generate and send OTP to the user's email for login."""
    data = request.get_json()
    contact = data.get('contact', '').strip()
    if not contact:
        return jsonify({'error': 'Email or phone is required'}), 400

    user = find_user_by_contact(contact)
    if not user:
        return jsonify({'error': 'No account found with this email/phone'}), 404

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    contact_type = 'email' if '@' in contact else 'phone'
    otp_code = generate_otp(session_id, contact_type, contact)

    if contact_type == 'email':
        try:
            send_otp_email(contact, otp_code)
        except Exception as e:
            app.logger.error(f"Failed to send login OTP email: {e}")
            return jsonify({'error': 'Failed to send OTP email. Check SMTP settings.'}), 500

    session['login_otp_user_id'] = user['id']
    return jsonify({'success': True, 'message': 'OTP sent successfully'})

@app.route('/api/verify-login-otp', methods=['POST'])
def verify_login_otp():
    """Verify OTP and log the user in."""
    data = request.get_json()
    contact = data.get('contact', '').strip()
    otp_code = data.get('otp', '').strip()

    if not contact or not otp_code:
        return jsonify({'error': 'Contact and OTP are required'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    if not verify_otp(session_id, contact, otp_code):
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    user_id = session.get('login_otp_user_id')
    if not user_id:
        return jsonify({'error': 'Session expired. Please request a new OTP.'}), 400

    user = find_user_by_contact(contact)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    link_session_to_user(session_id, user['id'])
    session.pop('login_otp_user_id', None)

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'phone': user['phone']
        }
    })

# ========================= OTHER ROUTES =========================
@app.route('/cookie-consent', methods=['POST'])
def cookie_consent():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data'}), 400

    status = data.get('status')
    preferences = data.get('preferences')
    if not status or not preferences:
        return jsonify({'error': 'Missing status or preferences'}), 400

    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    try:
        ip = get_client_ip(request)
        upsert_session(session_id, ip, None, None, None, None, request.headers.get('User-Agent', ''))
        save_cookie_consent(session_id, status, preferences)
        return jsonify({'success': True})
    except Exception as e:
        app.logger.error(f"Failed to save cookie consent: {e}")
        return jsonify({'error': str(e)}), 500

@app.before_request
def track_session():
    if request.endpoint and request.endpoint.startswith('static'):
        return

    if 'session_id' not in session:
        session.permanent = True
        session['session_id'] = str(uuid.uuid4())

    session_id = session['session_id']
    user_agent = request.headers.get('User-Agent', '')
    ip = get_client_ip(request)

    if ip and not is_private_ip(ip):
        city, country, lat, lon = get_geolocation(ip)
    else:
        city = country = lat = lon = None

    upsert_session(session_id, ip, city, country, lat, lon, user_agent)

@app.route('/admin/cleanup', methods=['POST'])
def cleanup_old_data():
    auth_key = request.headers.get('X-Admin-Key')
    if auth_key != os.getenv('ADMIN_KEY', 'mysecret'):
        return jsonify({'error': 'Unauthorized'}), 401

    chat_deleted = delete_old_chat_history(4)
    return jsonify({
        'success': True,
        'chat_history_deleted': chat_deleted,
    })

@app.route('/api/chat-history', methods=['GET'])
def chat_history():
    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400
    user = get_user_from_session(session_id)
    if not user:
        return jsonify({'error': 'User not logged in'}), 401
    history = get_todays_chat_history(user['id'])
    return jsonify({'success': True, 'history': history})

@app.route('/api/user-requests', methods=['GET'])
def user_requests():
    session_id = session.get('session_id')
    if not session_id:
        return jsonify({'error': 'No active session'}), 400

    user = get_user_from_session(session_id)
    if not user:
        return jsonify({'error': 'User not logged in'}), 401

    inquiries = get_user_inquiries(user['id'], limit=50)
    return jsonify({'success': True, 'requests': inquiries})

# ---------- Serve React (if needed) ----------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path.startswith('api/') or path.startswith('static/') or path in ['cookie-consent', 'accept_terms', 'chat', 'inquiry', 'admin']:
        return abort(404)
    react_build_dir = os.path.join(os.path.dirname(__file__), 'medibot-react', 'dist')
    if path != "" and os.path.exists(os.path.join(react_build_dir, path)):
        return send_from_directory(react_build_dir, path)
    else:
        return send_from_directory(react_build_dir, 'index.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)