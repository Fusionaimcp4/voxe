import Link from "next/link"

export const metadata = {
  title: "Privacy Policy | Voxe",
  description:
    "Learn how Voxe (the Africa-focused sister platform of Voxe by MCP4 AI) collects, uses, stores, and protects your data, including chat transcripts and integrations.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full px-5 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-invert max-w-none mt-8 space-y-6">
          <p>
            Voxe ("Voxe", "we", "our", or "us") provides an AI-powered customer
            support platform combining automated agents with human escalation. This Privacy Policy
            explains how we collect, use, disclose, and protect information in connection with
            Voxe.com and related services. Voxe.com is the Africa-focused version of Voxe,
            developed by MCP4 AI. Data is processed under the same privacy standards used for Voxe
            globally.
          </p>

          <h2>1. Introduction & Scope</h2>
          <p>
            This policy applies to data collected via our website, product, APIs, and integrations.
            By using our services, you agree to the practices described here.
          </p>

          <h2>2. Data We Collect</h2>
          <ul>
            <li>Account data: name, email, company, role.</li>
            <li>Support data: chat transcripts, messages, attachments, metadata, routing notes.</li>
            <li>Technical data: IP address, device/browser information, usage analytics, cookies.</li>
            <li>
              Integration data from services you connect such as Chatwoot, n8n, Twilio, ElevenLabs,
              and BTCPay.
            </li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>Provide, maintain, and improve AI and human-assisted support features.</li>
            <li>Route, summarize, and escalate conversations appropriately.</li>
            <li>Authenticate users and secure the platform.</li>
            <li>Analyze performance and reliability; prevent abuse.</li>
            <li>Communicate service updates and respond to inquiries.</li>
          </ul>

          <h2>4. Cookies & Tracking</h2>
          <p>
            We use cookies and similar technologies for authentication, preferences, and analytics.
            You can control cookies via your browser settings; disabling them may impact features.
          </p>

          <h2>5. AI Conversations & Logs</h2>
          <p>
            Conversation content may be processed by AI models to generate responses, detect intent,
            and improve routing. Logs are retained to provide context, quality assurance, and
            security. We restrict access and implement safeguards appropriate to the sensitivity of
            the data.
          </p>

          <h2>6. Payment Data</h2>
          <p>
            We support payments in USD and Bitcoin. Card payments may be processed by providers such
            as Stripe (or equivalents). Bitcoin payments may be processed via BTCPay. We do not store
            full card details on our servers. Payment processors handle your financial information in
            accordance with their own privacy policies.
          </p>

          <h2>7. Data Sharing</h2>
          <p>
            We do not sell personal data. We share data only with your configured integrations and
            service providers necessary to operate the platform (e.g., hosting, analytics, and the
            integrations listed above). These parties are bound by appropriate confidentiality and
            data-processing terms.
          </p>

          <h2>8. Data Retention</h2>
          <p>
            We retain data for as long as necessary to provide the service, comply with legal
            obligations, resolve disputes, and enforce agreements. You may request deletion as
            described below.
          </p>

          <h2>9. Your Rights</h2>
          <ul>
            <li>Access: request a copy of your data.</li>
            <li>Correction: request corrections to inaccurate data.</li>
            <li>Deletion: request deletion of certain data, subject to legal obligations.</li>
          </ul>

          <h2>10. Security Measures</h2>
          <p>
            We employ administrative, technical, and organizational safeguards appropriate to the
            risk, including encryption in transit, access controls, and audit logging. No method of
            transmission or storage is 100% secure.
          </p>

          <h2>11. Children’s Privacy</h2>
          <p>
            Our services are not directed to children under 13, and we do not knowingly collect data
            from them. If you believe a child has provided data, please contact us.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            Email: <a href="mailto:contact@localboxs.com">contact@localboxs.com</a>
            <br /> Address: Addis Ababa, Ethiopia (updateable)
          </p>

          <h2>13. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be
            indicated by an updated date and will be effective as soon as it is accessible.
          </p>
        </div>
      </div>
    </main>
  )
}


