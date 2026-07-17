import { Link } from 'react-router-dom';
import './PolicyPages.css';

export default function CookiePolicy() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <div className="avatar">💊</div>
          <h1>Cookie Policy</h1>
          <Link to="/">← Back to MediBot</Link>
        </div>

        <p>
          <strong>Last updated:</strong> June 2026
        </p>
        <p>Please read this agreement carefully, as it contains important information regarding your legal rights and remedies.</p>
        <div className="legal-note">
          <strong>We care about your privacy.</strong> This website uses cookies that are necessary for the site to
          work properly and to collect anonymous usage data to improve our service. By continuing to use MediBot, you
          agree to our use of cookies as described in this policy.
        </div>

        <h2>1. General Information About Cookies</h2>
        <p>
          We use cookies on our Website to ensure the chatbot functions correctly, to remember your selections during
          a session, and to understand how you interact with the assistant so we can continuously improve.
        </p>
        <p>
          <strong>What is a cookie?</strong>
        </p>
        <p>A cookie is a small file placed onto your device that enables our Website's features and functionality. For example, cookies enable us to:</p>
        <ul>
          <li>Maintain your active chat session (so you don't lose your place)</li>
          <li>Store your product selections and conversation history during a session</li>
          <li>Remember your cookie consent preferences</li>
          <li>Analyse anonymised usage patterns to improve the chatbot's responses</li>
        </ul>
        <p>
          We <strong>do not</strong> sell your personal information. We do not use cookies for advertising, and we do
          not share your data with third parties for marketing purposes.
        </p>

        <h2>2. Cookies Used on the Website</h2>
        <p>Below is a detailed list of all cookies we set, their purpose, expiry, and category. We only use first‑party cookies – we do not set any third‑party cookies.</p>

        <table className="cookie-table">
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Purpose</th>
              <th>Expiry / Duration</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>session</code></td>
              <td>Maintains your chat session: stores product ID, chat history, and context so the bot can remember what you've talked about.</td>
              <td>Session (browser close) or up to 1 day (as set by server)</td>
              <td><span className="badge essential">Essential</span></td>
            </tr>
            <tr>
              <td><code>cookie_consent</code></td>
              <td>Stores your cookie preference choices (which categories you have allowed). Used to respect your privacy settings.</td>
              <td>365 days</td>
              <td><span className="badge essential">Essential</span></td>
            </tr>
            <tr>
              <td><code>cookie_consent_dismissed</code></td>
              <td>Indicates that you have dismissed the cookie banner without explicitly saving preferences; prevents the banner from reappearing on every page load.</td>
              <td>1 day</td>
              <td><span className="badge functional">Functional</span></td>
            </tr>
          </tbody>
        </table>

        <p>
          <strong>Category explanations:</strong>
        </p>
        <ul>
          <li><strong>Essential (Strictly Necessary):</strong> These cookies are required for the chatbot to function. They enable session management, product selection, chat history, and consent storage. They cannot be turned off.</li>
          <li><strong>Functional:</strong> These are not currently used for essential functionality, but we include the category for future improvements (e.g., remembering UI preferences).</li>
          <li><strong>Analytics:</strong> We do not use any analytics cookies at present. However, we may collect anonymised usage data on our server (not via cookies) to improve the service. You will be informed before any such cookies are introduced.</li>
          <li><strong>Advertising:</strong> We do not display ads and do not use advertising cookies.</li>
        </ul>

        <h2>3. Third‑Party Cookies</h2>
        <p>
          MediBot does not use any third‑party cookies. We do not integrate with social networks, advertising
          networks, or external analytics platforms that would set their own cookies on your device. All cookies
          listed above are set directly by our domain.
        </p>

        <h2>4. Your Consent and Choices</h2>
        <p>When you first visit MediBot, you will see a cookie banner that lets you:</p>
        <ul>
          <li><strong>Accept all</strong> – allows all categories (currently only essential and functional).</li>
          <li><strong>Reject all</strong> – blocks optional cookies (functional) and keeps only essential ones.</li>
          <li><strong>Preferences</strong> – customise your settings per category.</li>
        </ul>
        <p>
          You can change your preferences at any time by clicking the <strong>"Preferences"</strong> link on the
          cookie banner. Additionally, you can manage cookies directly in your browser settings; however, disabling
          essential cookies will prevent the chatbot from working properly.
        </p>
        <p>
          <strong>Opt‑out of analytics:</strong> Since we do not currently use analytics cookies, this does not apply.
          If we introduce analytics cookies in the future, we will provide an opt‑out mechanism (e.g., via Google
          Analytics opt‑out add‑on).
        </p>

        <h2>5. Data Storage and Security</h2>
        <p>
          Any data collected via cookies (such as session identifiers and chat history) is stored securely on our
          servers. We do not sell, share, or otherwise disclose your personal data to third parties except as
          required by law. For more details, please see our <Link to="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link>
        </p>
        <p>
          You may request that we delete all data collected about you (including from cookies) by contacting us at{' '}
          <a href="mailto:privacy@medibot.example.com" style={{ color: '#2563eb' }}>privacy@medibot.example.com</a>. We
          will respond within 30 days.
        </p>

        <h2>6. Updates to This Policy</h2>
        <p>
          This Cookie Policy may be updated from time to time to reflect changes in our practices or for legal
          reasons. We will inform you by posting the new version on this page. We encourage you to check this page
          periodically for any changes.
        </p>

        <h2>7. Contact Us</h2>
        <p>If you have any questions about our cookie policy, please contact us at:</p>
        <p>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@medibot.example.com" style={{ color: '#2563eb' }}>privacy@medibot.example.com</a>
          <br />
          <strong>Address:</strong> Pune, India
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
