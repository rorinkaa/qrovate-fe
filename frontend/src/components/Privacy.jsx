import React from 'react';

const dataUses = [
  { label: 'Account data', detail: 'Email, hashed password, plan selection — used to authenticate and deliver your workspace.' },
  { label: 'Scan telemetry', detail: 'Timestamp, approximate IP region, user-agent — helps power analytics and detect abuse.' },
  { label: 'Billing info', detail: 'Handled by our payment processor; we never store full card numbers on QRovate servers.' }
];

export default function Privacy() {
  return (
    <div className="legal-content">
      <header className="legal-header">
        <span className="legal-pill">Updated · April 2024</span>
        <h2>Privacy Policy</h2>
        <p>
          We care about transparency. This summary explains what data QRovate collects, how it is used, and the controls you have.
          Replace with your formal privacy statement when you publish the product.
        </p>
      </header>

      <section className="legal-section">
        <h3>What we collect</h3>
        <div className="legal-highlight-grid">
          {dataUses.map(item => (
            <article key={item.label}>
              <h4>{item.label}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="legal-section">
        <h3>How we use your information</h3>
        <ul className="legal-list">
          <li>Operate the QR builder, dynamic redirect service, and scan dashboards.</li>
          <li>Send product updates and essential service notices (you can opt out of marketing emails).</li>
          <li>Detect, investigate, and prevent misuse or security incidents.</li>
          <li>Generate anonymized insights to keep the platform reliable and efficient.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>Your choices & rights</h3>
        <p>
          You can update account details from the dashboard, export your data by contacting support, or request deletion
          of your workspace. For EU and UK residents we honor GDPR requests; for California customers we follow CCPA
          guidelines. We will respond to verified requests within 30 days.
        </p>
      </section>

      <section className="legal-section">
        <h3>Data retention & security</h3>
        <p>
          Dynamic scan logs are stored for the duration of your subscription to power analytics. Backups are encrypted at
          rest and access is limited to authorized team members. If you close your account we purge personal data within
          30 days unless retention is required by law.
        </p>
      </section>

      <footer className="legal-footer">
        <p>
          Have a privacy request? Email <a href="mailto:privacy@qrovate.com">privacy@qrovate.com</a> or write to us at
          123 Market Street, Suite 400, San Francisco, CA. We’ll update this policy when practices change and note the
          revision date at the top.
        </p>
      </footer>
    </div>
  );
}
