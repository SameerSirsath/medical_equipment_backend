import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# ─── Brevo Configuration ──────────────────────────────────────────
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@kaizy.com")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "KAIZY")

# ─── Brevo API Base URL ──────────────────────────────────────────
BREVO_API_URL = "https://api.brevo.com/v3"

# ─── Option 1: Send Email using Brevo API (Recommended) ─────────
def send_email_brevo_api(to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """
    Send email using Brevo's API.
    This is the recommended method as it's more reliable and faster.
    """
    if not BREVO_API_KEY:
        raise ValueError("BREVO_API_KEY environment variable is not set.")

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": BREVO_SENDER_NAME,
            "email": BREVO_SENDER_EMAIL
        },
        "to": [
            {
                "email": to_email,
                "name": to_email.split('@')[0]
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
    }

    # Add plain text version if provided
    if text_content:
        payload["textContent"] = text_content

    try:
        response = requests.post(
            f"{BREVO_API_URL}/smtp/email",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        print(f"✅ Email sent successfully to {to_email}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to send email via Brevo API: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return False

# ─── Option 2: Send Email using SMTP (Fallback) ──────────────────
def send_email_smtp(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Send email using SMTP with Brevo's SMTP servers.
    This is a fallback method if the API fails.
    """
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp-relay.brevo.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER")  # Your Brevo SMTP login (usually your email)
    SMTP_PASS = os.getenv("SMTP_PASS")  # Your Brevo SMTP password

    if not SMTP_USER or not SMTP_PASS:
        raise ValueError("SMTP_USER and SMTP_PASS must be set in environment.")

    # Create message container
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{BREVO_SENDER_NAME} <{BREVO_SENDER_EMAIL}>"
    msg["To"] = to_email

    # Plain text version
    part1 = MIMEText(body, "plain", "utf-8")
    msg.attach(part1)

    # HTML version (optional)
    if html_body:
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part2)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(BREVO_SENDER_EMAIL, [to_email], msg.as_string())
        print(f"✅ Email sent successfully to {to_email} via SMTP")
        return True
    except Exception as e:
        print(f"❌ Failed to send email via SMTP: {e}")
        return False

# ─── Unified Send Function ──────────────────────────────────────
def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Unified email sending function.
    Tries Brevo API first, then falls back to SMTP.
    """
    # If HTML body is provided, use it; otherwise use plain text
    html_content = html_body or body.replace('\n', '<br>')
    text_content = body

    # Try API first (recommended)
    try:
        return send_email_brevo_api(to_email, subject, html_content, text_content)
    except Exception as e:
        print(f"⚠️ Brevo API failed: {e}. Falling back to SMTP...")
        try:
            return send_email_smtp(to_email, subject, text_content, html_content)
        except Exception as smtp_e:
            print(f"❌ SMTP also failed: {smtp_e}")
            return False

# ─── Send OTP Email ──────────────────────────────────────────────
def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send an OTP email with a predefined template.
    """
    subject = "Your KAIZY Login OTP"

    # Plain text version
    body = f"""
Hello,

Your one-time password (OTP) for KAIZY is:

    {otp_code}

This OTP is valid for 5 minutes. Please do not share it with anyone.

If you did not request this, please ignore this email.

Thank you,
KAIZY Team
"""

    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #0b2a4a; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }}
        .content {{ padding: 30px; background: #f9fbfd; border-radius: 0 0 8px 8px; }}
        .otp-code {{ 
            font-size: 36px; 
            font-weight: bold; 
            background: #e9edf2; 
            padding: 15px 30px; 
            display: inline-block; 
            border-radius: 8px;
            letter-spacing: 4px;
            color: #0b2a4a;
            margin: 15px 0;
        }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }}
        .warning {{ color: #ef4444; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KAIZY</h1>
            <p style="margin: 0;">Medical Equipment Assistant</p>
        </div>
        <div class="content">
            <h2>Your OTP Code</h2>
            <p>Hello,</p>
            <p>Your one-time password (OTP) for KAIZY is:</p>
            <div style="text-align: center;">
                <span class="otp-code">{otp_code}</span>
            </div>
            <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
            <p class="warning">⚠️ If you did not request this, please ignore this email.</p>
            <p>Thank you,<br><strong>KAIZY Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2026 KAIZY. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

    return send_email(to_email, subject, body, html_body)

# ─── Quick Test ──────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_email = sys.argv[1]
        print(f"📧 Sending test OTP to {test_email}...")
        success = send_otp_email(test_email, "123456")
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email.")
    else:
        print("Usage: python email_utils.py your-email@example.com")