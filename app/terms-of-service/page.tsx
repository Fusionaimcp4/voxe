import Link from "next/link"

export const metadata = {
  title: "Terms of Service | Voxe",
  description:
    "Read the Terms of Service for Voxe, the Africa-focused sister platform of Voxe by MCP4 AI. Covers usage, payments, limitations, and governing law.",
}

export default function TermsOfServicePage() {
  return (
    <main className="w-full px-5 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-primary hover:underline">← Back to Home</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-invert max-w-none mt-8 space-y-6">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Voxe (the “Service”), you agree to these Terms of Service
            (“Terms”). If you are using the Service on behalf of an organization, you represent that
            you have the authority to bind that organization to these Terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Voxe provides an AI + human hybrid customer support platform. AI agents handle
            common requests and can automatically escalate to human agents when needed. Features may
            include multi‑channel messaging, routing, analytics, and integrations.
          </p>

          <h2>3. Account Registration & Responsibilities</h2>
          <ul>
            <li>You must provide accurate account information and keep it updated.</li>
            <li>You are responsible for safeguarding account credentials and activity.</li>
            <li>You will ensure your use complies with applicable laws and these Terms.</li>
          </ul>

          <h2>4. Acceptable Use Policy</h2>
          <ul>
            <li>No unlawful, harmful, or abusive content or conduct.</li>
            <li>No interference with or disruption of the Service or others’ use of it.</li>
            <li>No reverse engineering or unauthorized access to non-public areas.</li>
          </ul>

          <h2>5. Payment & Subscription</h2>
          <p>
            Pricing may include setup fees and ongoing subscription or usage fees. Payments can be in
            USD or Bitcoin (via BTCPay). You are responsible for any taxes. Failure to pay may result
            in suspension or termination of the Service.
          </p>

          <h2>6. AI Limitations & Disclaimer</h2>
          <p>
            By using Voxe.mcp4.ai, you acknowledge that interactions may involve AI responses
            generated for speed and efficiency. Voxe makes reasonable efforts to ensure
            accuracy but provides no guarantee of completeness or suitability.
          </p>

          <h2>7. Liability & Warranty Disclaimer</h2>
          <p>
            THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE MAXIMUM EXTENT PERMITTED BY LAW,
            Voxe AND MCP4 AI DISCLAIM ALL WARRANTIES AND LIMIT LIABILITY FOR INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate your access for any violation of these Terms or if required
            by law. You may stop using the Service at any time. Certain provisions survive
            termination, including those relating to limitations of liability and ownership.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard to its
            conflict of law principles, pending Voxe' local incorporations.
          </p>

          <h2>10. Contact</h2>
          <p>
            Email: <a href="mailto:contact@mcp4.com">contact@mcp4.com</a>
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes
            take effect constitutes acceptance of the updated Terms.
          </p>
        </div>
      </div>
    </main>
  )
}


