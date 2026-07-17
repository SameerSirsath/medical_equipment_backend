import { Link } from 'react-router-dom';
import './Terms.css';

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>📋 Terms and Conditions</h1>
        {/* <p className="last-updated"><strong>Last updated:</strong> June 22, 2026</p> */}

        <p>Welcome to MediBot. By using this chatbot, you agree to the following terms:</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By using MediBot, you agree to be bound by these Terms. If you do not agree, please do not use the service.</p>

        <h2>2. Use of Service</h2>
        <p>You agree to use the service only for lawful purposes and in a way that does not infringe the rights of others. You must not misuse the chatbot for any harmful or illegal activities.</p>

        <h2>3. Data Collection and Privacy</h2>
        <p>We may collect your IP address, location, and chat history to improve our services. This data is stored securely and used only for analytics, support, and personalisation. We do not share your data with third parties without your explicit consent.</p>

        <h2>4. Medical Disclaimer</h2>
        <p>The information provided by MediBot is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.</p>

        <h2>5. Limitation of Liability</h2>
        <p>We are not liable for any damages arising from the use of this service. The service is provided "as is" without warranties of any kind.</p>

        <h2>6. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of MediBot after changes constitutes acceptance of the updated terms.</p>

        <h2>7. Contact</h2>
        <p>
          If you have any questions, please contact us at <a href="mailto:support@mail.com.com">support@mail.com</a>.
        </p>

        <Link to="/" className="back-link">← Back to MediBot</Link>
      </div>
    </div>
  );
}
