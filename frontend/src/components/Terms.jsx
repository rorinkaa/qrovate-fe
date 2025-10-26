import React from 'react';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from '../config/planLimits.js';

const highlights = [
  { title: 'Fair use only', detail: 'No phishing, malware, harassment, or unlawful content is permitted on the platform.' },
  { title: 'You own your data', detail: 'Uploaded destinations and assets remain yours; you grant us the rights needed to render your QR codes.' },
  { title: 'Service evolves', detail: 'We may ship improvements or pause features — we’ll give notice of material changes whenever possible.' },
  { title: 'No guaranteed uptime', detail: 'We run commercially reasonable infrastructure but provide the service “as is”.' }
];

export default function Terms() {
  const freePlanCopy = UPGRADES_ENABLED
    ? `Free plans include static QR creation and ${FREE_PLAN_DYNAMIC_LIMIT} dynamic QR${FREE_PLAN_DYNAMIC_LIMIT === 1 ? '' : 's'}. Paid plans unlock advanced styling, analytics, and collaboration tools.`
    : 'Free plans currently include static and dynamic QR creation while paid tiers are unavailable.';

  return (
    <div className="legal-content">
      <header className="legal-header">
        <span className="legal-pill">Updated · April 2024</span>
        <h2>Terms of Service</h2>
        <p>
          These terms outline how you can use QRovate’s tools to design, launch, and manage QR experiences.
          They are a friendly summary — replace with your official agreement when you go live.
        </p>
      </header>

      <section className="legal-section">
        <h3>1. Using QRovate</h3>
        <p>
          QRovate helps you generate static and dynamic QR codes, track scan metrics, and manage branded campaigns.
          You’re responsible for the content you encode and the destinations you point scanners to.
          Don’t abuse the service, interfere with other users, or attempt to reverse engineer the platform.
        </p>
        <ul className="legal-list">
          <li>Provide accurate account information and keep your login secure.</li>
          <li>Do not deploy QR codes that redirect to harmful, deceptive, or illegal content.</li>
          <li>Respect rate limits and platform security safeguards.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h3>2. Ownership & Licenses</h3>
        <p>
          You retain ownership of the content you upload. By using the service you grant us a limited license to host,
          reproduce, and display that content solely to operate and improve QRovate. We may collect aggregate analytics
          about scan behavior to enhance reliability and catch abuse.
        </p>
      </section>

      <section className="legal-section">
        <h3>3. Payments & Plans</h3>
        <p>
          {freePlanCopy}
        </p>
      </section>

      <section className="legal-section">
        <h3>4. Term, Suspension, Termination</h3>
        <p>
          We may suspend or terminate your access if you violate these terms or if required by law. You can cancel
          anytime via your dashboard. After cancellation, dynamic redirects will stop working and stored assets may be
          deleted.
        </p>
      </section>

      <section className="legal-section legal-highlights">
        <h3>Key takeaways</h3>
        <div className="legal-highlight-grid">
          {highlights.map(item => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="legal-footer">
        <p>
          Questions? Reach out at <a href="mailto:support@qrovate.com">support@qrovate.com</a>.
          Updates to these terms will be posted here with the effective date above.
        </p>
      </footer>
    </div>
  );
}
