import { Link } from 'react-router-dom';
import './PolicyPages.css';

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <div className="avatar">💊</div>
          <h1>Privacy Policy</h1>
          <Link to="/">← Back to MediBot</Link>
        </div>

        <p>
          <strong>Last updated:</strong> June 2026
        </p>
        <div className="legal-note">
          <strong>Your privacy matters to us.</strong> This policy explains how MediBot collects, uses, and protects
          your personal data when you interact with our chatbot and website.
        </div>

        <h2>1. Who we are</h2>
        <p>
          MediBot is a medical equipment assistant chatbot operated by Medibot Ltd. We are committed to safeguarding
          your privacy and ensuring that your personal data is handled transparently and securely.
        </p>

        <h2>2. What information we collect</h2>
        <p>We collect the following types of information to provide and improve our service:</p>
        <ul>
          <li><strong>Session data:</strong> When you visit MediBot, we assign a unique session ID. This helps us maintain your chat context, remember your product selections, and keep your conversation history during the session.</li>
          <li><strong>Chat messages:</strong> Your questions and our responses are stored to improve the chatbot's accuracy and to handle follow‑up inquiries. This data is anonymised for analysis.</li>
          <li><strong>Device and usage data:</strong> We collect your IP address, browser type, and geolocation (city and country) to understand our user base and to prevent abuse. This information is stored in a secure database.</li>
          <li><strong>Inquiry details:</strong> If you request a quote or more information, we collect your name, email address, and phone number, along with the product details you are interested in.</li>
          <li><strong>Cookie preferences:</strong> We store your cookie consent choices (essential, functional, analytics, advertising) to respect your privacy settings.</li>
        </ul>
        <p>We do <strong>not</strong> collect sensitive personal data such as health records, payment information, or government IDs.</p>

        <h2>3. How we use your information</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li>To operate and maintain the chatbot, ensuring it responds correctly and remembers your session.</li>
          <li>To analyse usage patterns (e.g., which products are most queried) to improve MediBot's performance and content.</li>
          <li>To process and respond to your inquiries, quotes, or support requests.</li>
          <li>To comply with legal obligations and enforce our policies.</li>
          <li>To customise your experience (e.g., remembering your language preference, if we introduce that in the future).</li>
        </ul>
        <p>We do <strong>not</strong> sell, rent, or share your personal data with third parties for marketing or advertising purposes.</p>

        <h2>4. Legal basis for processing</h2>
        <p>We process your data based on:</p>
        <ul>
          <li><strong>Contractual necessity:</strong> To provide the chatbot service you requested.</li>
          <li><strong>Legitimate interests:</strong> To improve our service, analyse usage, and ensure security.</li>
          <li><strong>Consent:</strong> Where you have given explicit consent (e.g., for optional cookies or inquiry submission).</li>
          <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations.</li>
        </ul>

        <h2>5. How long we keep your data</h2>
        <p>
          Chat history and session data are retained for up to 4 days, after which they are automatically deleted
          from our database. Inquiry records are kept for as long as necessary to fulfil your request and for legal
          compliance (e.g., tax or audit purposes). Cookie consent records are retained for 365 days or until you
          withdraw your consent.
        </p>
        <p>You may request deletion of your data at any time by contacting us (see section 9).</p>

        <h2>6. Do we share your data?</h2>
        <p>
          We do <strong>not</strong> share your personal data with third parties, except:
        </p>
        <ul>
          <li>When required by law (e.g., to comply with a court order or regulatory request).</li>
          <li>With our trusted service providers (e.g., hosting provider) who process data on our behalf and are bound by strict confidentiality agreements.</li>
        </ul>
        <p>We do not use third‑party analytics or advertising services that would set their own cookies or track you across websites.</p>

        <h2>7. How we protect your data</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your data against unauthorised
          access, alteration, disclosure, or destruction. This includes encryption, secure server infrastructure, and
          access controls. However, no method of transmission over the internet is 100% secure, and we cannot
          guarantee absolute security.
        </p>

        <h2>8. Your rights</h2>
        <p>Under data protection laws, you have the following rights:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Ask us to correct inaccurate or incomplete information.</li>
          <li><strong>Deletion:</strong> Request that we delete your personal data (subject to legal obligations).</li>
          <li><strong>Restriction:</strong> Ask us to limit processing of your data in certain circumstances.</li>
          <li><strong>Portability:</strong> Receive your data in a structured, machine‑readable format.</li>
          <li><strong>Object:</strong> Object to processing based on legitimate interests.</li>
          <li><strong>Withdraw consent:</strong> If you have given consent, you may withdraw it at any time.</li>
        </ul>
        <p>To exercise any of these rights, please contact us using the details in section 9. We will respond within 30 days.</p>

        <h2>9. Contact us</h2>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to us at:</p>
        <p>
          <strong>Email:</strong> <a href="mailto:support@medibot.com" style={{ color: '#2563eb' }}>support@medibot.com</a>
          <br />
          <strong>Address:</strong> Pune, India
        </p>

        <h2>10. Updates to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for legal
          reasons. We will notify you by posting the new version on this page with an updated "Last updated" date. We
          encourage you to review this page periodically.
        </p>

        <Link to="/" className="back-link">← Return to MediBot</Link>

        <div className="footer-note">
          &copy; 2026 MediBot – Medical Equipment Assistant &nbsp;|&nbsp; <Link to="/cookies">Cookie Policy</Link>{' '}
          &nbsp;|&nbsp; <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
