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

# ─── SMTP Configuration ───────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "KAIZY")

# Validate required credentials at startup
if not SMTP_USER or not SMTP_PASS:
    raise ValueError(
        "SMTP_USER and SMTP_PASS must be set in environment variables.\n"
        "Generate an App Password at: https://myaccount.google.com/apppasswords"
    )

# ─── Helper: Build Email Content ─────────────────────────────
def build_otp_email(otp_code: str) -> tuple:
    """
    Return (subject, plain_text_body, html_body) for an OTP email.
    """
    subject = "Your KAIZY Login OTP"

    # Plain text version (for email clients that don't support HTML)
    plain_body = f"""
Hello,

Your one-time password (OTP) for KAIZY is:

    {otp_code}

This OTP is valid for 5 minutes. Please do not share it with anyone.

If you did not request this, please ignore this email.

Thank you,
KAIZY Team
"""

    # HTML version (modern, branded)
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
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
            <h1 style="margin:0;">KAIZY</h1>
            <p style="margin:0;">Medical Equipment Assistant</p>
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

    return subject, plain_body, html_body

# ─── Send Email ───────────────────────────────────────────────
def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send OTP email via Gmail SMTP.
    Returns True if successful, False otherwise.
    """
    if not to_email:
        logger.error("Recipient email is empty.")
        return False

    # Build email content
    subject, plain_body, html_body = build_otp_email(otp_code)

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
        logger.info(f"✅ OTP email sent successfully to {to_email}")
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
        print(f"📧 Sending test OTP to {test_email}...")
        success = send_otp_email(test_email, "123456")
        if success:
            print("✅ Test email sent successfully!")
        else:
            print("❌ Failed to send test email.")
    else:
        print("Usage: python email_utils.py your-email@example.com")