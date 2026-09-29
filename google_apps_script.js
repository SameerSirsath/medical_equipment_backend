/**
 * ============================================================================
 * KAIZY Medical Equipment - Google Apps Script Email Service
 * ============================================================================
 * 
 * This script runs in Google Apps Script and acts as an email dispatcher for:
 *   - Login OTP verification
 *   - Signup / Registration OTP verification
 *   - Quotation inquiry OTP verification
 * 
 * Emails are sent directly through your Gmail account with zero SMTP setup needed!
 * 
 * ----------------------------------------------------------------------------
 * STEP-BY-STEP SETUP INSTRUCTIONS:
 * ----------------------------------------------------------------------------
 * 1. Open your browser and go to: https://script.google.com/
 * 2. Sign in with the Google / Gmail account you want to send emails from.
 * 3. Click "+ New project" in the top-left corner.
 * 4. Rename the project (top-left) to "KAIZY Email Service".
 * 5. Replace everything in "Code.gs" with this entire file.
 * 6. (Optional) If you want extra security, set AUTH_TOKEN below to a secret password.
 *    Otherwise, keep AUTH_TOKEN = "" (leave empty) for simplicity.
 * 7. Click "Deploy" (blue button in top-right) -> "New deployment".
 * 8. Click the gear icon (Select type) next to "Select type" and choose "Web app".
 * 9. Set the fields:
 *      - Description: KAIZY OTP Mailer
 *      - Execute as: "Me (<your-email@gmail.com>)"   <-- MUST BE "Me"
 *      - Who has access: "Anyone"                    <-- MUST BE "Anyone"
 * 10. Click "Deploy".
 * 11. Google will ask you to "Authorize access":
 *      - Click "Authorize access"
 *      - Choose your Google account
 *      - If you see "Google hasn't verified this app", click "Advanced" -> "Go to KAIZY Email Service (unsafe)"
 *      - Click "Allow"
 * 12. Copy the "Web app URL" (it will look like https://script.google.com/macros/s/.../exec).
 * 13. Paste this URL into your backend .env file:
 *      GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *      (And if you set an AUTH_TOKEN below, add: GOOGLE_SCRIPT_TOKEN=your-token)
 * 14. If hosting on Render/cloud, also add GOOGLE_SCRIPT_URL in Render's Environment Variables!
 * ============================================================================
 */

// Optional: Set a secret token for authorization, or leave as "" (empty string) to allow open access
const AUTH_TOKEN = "";

/**
 * Handle incoming POST requests from the backend
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: "Empty request payload" });
    }

    // Parse JSON payload
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return responseJSON({ success: false, error: "Invalid JSON format: " + parseErr.toString() });
    }

    // Validate Auth Token if configured
    if (AUTH_TOKEN && AUTH_TOKEN.trim() !== "") {
      const incomingToken = data.auth_token || (e.parameter && e.parameter.auth_token);
      if (incomingToken !== AUTH_TOKEN) {
        return responseJSON({ success: false, error: "Unauthorized: Invalid or missing token" });
      }
    }

    // Extract email details
    const to = data.to;
    if (!to || !to.includes("@")) {
      return responseJSON({ success: false, error: "Missing or invalid recipient ('to') email" });
    }

    const subject = data.subject || "KAIZY Verification Code";
    const body = data.body || ("Your OTP code is: " + (data.otp || ""));
    const htmlBody = data.htmlBody;
    const purpose = data.purpose || "general";

    const mailOptions = {
      name: "KAIZY Medical Equipment"
    };

    if (htmlBody) {
      mailOptions.htmlBody = htmlBody;
    }

    // Send the email via user's Gmail account
    GmailApp.sendEmail(to, subject, body, mailOptions);

    return responseJSON({
      success: true,
      message: "Email sent successfully to " + to,
      purpose: purpose,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return responseJSON({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Handle GET requests (allows verifying deployment from your browser)
 */
function doGet(e) {
  return responseJSON({
    status: "online",
    service: "KAIZY Email Service",
    quotaRemaining: MailApp.getRemainingDailyQuota(),
    message: "Google Apps Script email service is active and ready to receive POST requests."
  });
}

/**
 * Helper to return JSON responses with correct MIME type
 */
function responseJSON(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
