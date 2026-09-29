import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file (for local dev)
load_dotenv()

# ─── Logging ──────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

# ─── SMTP / Google Script Configuration ──────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "KAIZY")

GOOGLE_SCRIPT_URL = os.getenv("GOOGLE_SCRIPT_URL", "https://script.google.com/macros/s/AKfycbxdZO-AEOlLQS9OywOln5LTPufDHD0ZWIR00ypcmeiH6UYf9zAWxU5nQ7HiLsH8w0dI/exec")
GOOGLE_SCRIPT_TOKEN = os.getenv("GOOGLE_SCRIPT_TOKEN")

# Validate required credentials at startup
if not GOOGLE_SCRIPT_URL and (not SMTP_USER or not SMTP_PASS):
    logger.warning(
        "Neither GOOGLE_SCRIPT_URL nor (SMTP_USER + SMTP_PASS) are configured. "
        "OTP emails will not be sent until email credentials are provided."
    )

# ─── Helper: Build Email Content ─────────────────────────────
def build_otp_email(otp_code: str, purpose: str = "verification") -> tuple:
    """
    Return (subject, plain_text_body, html_body) for an OTP email tailored to the purpose.
    Supported purposes: 'login', 'signup', 'inquiry', 'verification'.
    """
    p = (purpose or "verification").lower().strip()
    if p == "login":
        subject = "Your KAIZY Login Verification Code"
        title = "Login Verification"
        action_text = "Use the verification code below to log in to your KAIZY account."
    elif p == "signup":
        subject = "Your KAIZY Account Registration Code"
        title = "Account Registration"
        action_text = "Welcome to KAIZY! Use the verification code below to verify your email and complete your registration."
    elif p in ("inquiry", "quote"):
        subject = "Your KAIZY Quotation Request Verification Code"
        title = "Quotation Request Verification"
        action_text = "Thank you for your interest in KAIZY Medical Equipment. Use the verification code below to verify your quotation request."
    else:
        subject = "Your KAIZY Verification Code"
        title = "Verification Code"
        action_text = "Your one-time password (OTP) for KAIZY is:"

    # Plain text version
    plain_body = f"""Hello,

{action_text}

    {otp_code}

This OTP is valid for 5 minutes. Please do not share it with anyone.

If you did not request this, please ignore this email.

Thank you,
KAIZY Medical Team
"""

    # HTML version (modern, branded)
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }}
        .wrapper {{ width: 100%; padding: 30px 0; background-color: #f1f5f9; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }}
        .header {{ background: linear-gradient(135deg, #0b2a4a 0%, #1e40af 100%); padding: 28px 24px; text-align: center; color: white; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #ffffff; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #93c5fd; text-transform: uppercase; letter-spacing: 1px; }}
        .content {{ padding: 32px 28px; background: #ffffff; }}
        .content h2 {{ color: #0b2a4a; font-size: 20px; margin: 0 0 16px 0; }}
        .lead {{ font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0; }}
        .otp-box {{ text-align: center; margin: 24px 0; }}
        .otp-code {{
            font-size: 34px;
            font-weight: 800;
            background: #f8fafc;
            padding: 16px 32px;
            display: inline-block;
            border-radius: 10px;
            letter-spacing: 8px;
            color: #0b2a4a;
            border: 2px dashed #94a3b8;
        }}
        .notice {{ font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0; }}
        .warning {{ font-size: 12px; color: #dc2626; margin-top: 16px; padding: 10px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #dc2626; }}
        .signature {{ margin-top: 24px; font-size: 14px; color: #334155; }}
        .footer {{ padding: 18px 24px; font-size: 11px; color: #94a3b8; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>KAIZY</h1>
                <p>Medical Equipment & Technology</p>
            </div>
            <div class="content">
                <h2>{title}</h2>
                <p class="lead">Hello,</p>
                <p class="lead">{action_text}</p>
                <div class="otp-box">
                    <span class="otp-code">{otp_code}</span>
                </div>
                <p class="notice">⏱️ This code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.</p>
                <p class="warning">⚠️ If you did not initiate this request, you can safely ignore this email.</p>
                <p class="signature">Best regards,<br><strong>KAIZY Medical Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated security message from KAIZY. Please do not reply directly to this email.</p>
                <p>© 2026 KAIZY. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

    return subject, plain_body, html_body

# ─── Send Email ───────────────────────────────────────────────
def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Send OTP email via Google Apps Script Web App or Gmail SMTP fallback.
    Returns True if successful, False otherwise.
    """
    if not to_email:
        logger.error("Recipient email is empty.")
        return False

    # Check if we should use Google Apps Script Web App
    if GOOGLE_SCRIPT_URL:
        subject, plain_body, html_body = build_otp_email(otp_code, purpose=purpose)
        payload = {
            "to": to_email,
            "otp": otp_code,
            "subject": subject,
            "body": plain_body,
            "htmlBody": html_body,
            "purpose": purpose
        }
        if GOOGLE_SCRIPT_TOKEN:
            payload["auth_token"] = GOOGLE_SCRIPT_TOKEN

        try:
            import requests
            headers = {"Content-Type": "application/json"}
            response = requests.post(
                GOOGLE_SCRIPT_URL,
                json=payload,
                headers=headers,
                allow_redirects=True,
                timeout=15
            )
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("success"):
                logger.info(f"✅ OTP email ({purpose}) sent successfully to {to_email} via Google Apps Script")
                return True
            else:
                logger.warning(f"⚠️ Google Apps Script error: {res_data.get('error')}. Trying SMTP fallback...")
        except Exception as e:
            logger.warning(f"⚠️ Failed to send OTP email via Google Apps Script: {e}. Trying SMTP fallback...")

    # Fallback to SMTP if configured
    if not (SMTP_USER and SMTP_PASS):
        logger.error("SMTP credentials (SMTP_USER / SMTP_PASS) not configured and Google Apps Script was unsuccessful.")
        return False

    # Build email content (fallback to SMTP)
    subject, plain_body, html_body = build_otp_email(otp_code, purpose=purpose)

    # Create a multipart message with both plain and HTML alternatives
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email

    # Attach parts
    part_plain = MIMEText(plain_body, "plain", "utf-8")
    part_html = MIMEText(html_body, "html", "utf-8")
    msg.attach(part_plain)
    msg.attach(part_html)

    try:
        # Connect to Gmail's SMTP server
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()                    # Upgrade connection to secure
            server.login(SMTP_USER, SMTP_PASS)   # Authenticate with App Password
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        logger.info(f"✅ OTP email ({purpose}) sent successfully to {to_email} via SMTP")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"Authentication failed. Check your App Password. Error: {e}")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(f"Recipient refused. Error: {e}")
        return False
    except smtplib.SMTPServerDisconnected as e:
        logger.error(f"Server disconnected. Error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

# ─── Quick Test ─────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_email = sys.argv[1]
        purpose_arg = sys.argv[2] if len(sys.argv) > 2 else "verification"
        print(f"📧 Sending test OTP to {test_email} (purpose: {purpose_arg})...")
        success = send_otp_email(test_email, "123456", purpose=purpose_arg)
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email.")
    else:
        print("Usage: python email_utils.py your-email@example.com [login|signup|inquiry]")