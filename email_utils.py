# def send_otp_email(to_email, otp_code):
#     """Send OTP via SMTP."""
#     import smtplib
#     from email.mime.text import MIMEText
#     import os

#     SMTP_HOST = os.getenv("SMTP_HOST")
#     SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
#     SMTP_USER = os.getenv("SMTP_USER")
#     SMTP_PASS = os.getenv("SMTP_PASS")
#     SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
#     SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "KAIZY")

#     if not SMTP_USER or not SMTP_PASS:
#         raise ValueError("SMTP credentials not set in environment")

#     subject = "Your KAIZY Login OTP"
#     body = f"""
# Hello,

# Your one-time password (OTP) for KAIZY login is:

#     {otp_code}

# This OTP is valid for 5 minutes. Please do not share it with anyone.

# If you did not request this, please ignore this email.

# Thank you,
# KAIZY Team
# """
#     msg = MIMEText(body, "plain", "utf-8")
#     msg["Subject"] = subject
#     msg["From"] = SMTP_FROM
#     msg["To"] = to_email

#     with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
#         server.starttls()
#         server.login(SMTP_USER, SMTP_PASS)
#         server.sendmail(SMTP_FROM, [to_email], msg.as_string())


import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# ─── SMTP Configuration ──────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)               # actual email address
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "KAIZY")       # display name (optional)


def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Send an email using SMTP.
    Returns True if successful, raises exception on failure.
    """
    if not SMTP_USER or not SMTP_PASS:
        raise ValueError("SMTP_USER and SMTP_PASS must be set in environment")

    # Create message container
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    # Use display name + actual email address
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
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
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        raise  # re-raise so the caller can handle it


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send an OTP email with a predefined template.
    """
    subject = "Your KAIZY Login OTP"
    body = f"""
Hello,

Your one-time password (OTP) for KAIZY is:

    {otp_code}

This OTP is valid for 5 minutes. Please do not share it with anyone.

If you did not request this, please ignore this email.

Thank you,
KAIZY Team
"""
    html_body = f"""
<!DOCTYPE html>
<html>
<body>
    <p>Hello,</p>
    <p>Your one-time password (OTP) for KAIZY is:</p>
    <h2 style="font-size: 32px; background: #f0f4f8; padding: 10px; display: inline-block;">{otp_code}</h2>
    <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thank you,<br>KAIZY Team</p>
</body>
</html>
"""
    return send_email(to_email, subject, body, html_body)