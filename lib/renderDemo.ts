export interface DemoCtx {
  businessName: string;
  slug: string;
  primary?: string;
  secondary?: string;
  logoUrl?: string;
  chatwootBaseUrl: string;
  websiteToken: string;
}

export function renderDemoHTML(ctx: DemoCtx): string {
  const {
    businessName,
    slug,
    primary = '#7ee787',
    secondary = '#f4a261',
    logoUrl,
    chatwootBaseUrl,
    websiteToken,
  } = ctx;

  const logoBlock = logoUrl
    ? `<img class="logo" src="${logoUrl}" alt="${businessName} Logo" />`
    : '';

  const template = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${businessName} • AI Support Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{ --primary:${primary}; --secondary:${secondary}; }
    *{box-sizing:border-box}
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:linear-gradient(to bottom, #09090b, #18181b);color:#f4f4f5}
    a{color:inherit;text-decoration:none}
    header{
      padding:64px 24px 80px;
      text-align:center;
      background:
        radial-gradient(60% 60% at 50% 0%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 60%),
        linear-gradient(180deg,var(--secondary),#09090b 70%);
    }
    .container{max-width:1000px;margin:0 auto;padding:0 24px}
    h1{margin:0;font-size:36px;letter-spacing:-0.02em;font-weight:700}
    .tag{display:inline-block;margin-top:16px;padding:8px 16px;border-radius:999px;background:var(--primary);color:#052e16;font-weight:600;font-size:14px}
    .logo{height:64px;margin:0 auto 16px;display:block;filter:drop-shadow(0 8px 32px rgba(0,0,0,0.4))}
    main{max-width:1000px;margin:-48px auto 64px;padding:0 24px}
    .card{background:rgba(24,24,27,0.6);border:1px solid #27272a;border-radius:24px;padding:24px;backdrop-filter:blur(8px)}
    .muted{color:#a1a1aa}
    .grid{display:grid;gap:16px}
    @media(min-width:680px){ .grid-3{grid-template-columns:repeat(3,1fr)} .grid-2{grid-template-columns:repeat(2,1fr)} }
    .feature{border:1px solid #27272a;border-radius:20px;padding:20px;background:rgba(24,24,27,0.4);transition:all 0.2s ease}
    .feature:hover{border-color:var(--primary);background:rgba(24,24,27,0.6)}
    .feature h3{margin:0 0 8px;font-size:16px;font-weight:600;color:#f4f4f5}
    .feature p{margin:0;font-size:14px;color:#a1a1aa;line-height:1.5}
    .steps li, .prompts li{margin:12px 0;padding:12px;border:1px solid #27272a;border-radius:16px;background:rgba(24,24,27,0.4)}
    .steps li{border:1px solid #27272a;border-radius:16px;padding:16px}
    .pill{display:inline-block;border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:4px 12px;font-size:12px;color:#d4d4d8;background:rgba(24,24,27,0.6)}
    .promo{display:flex;flex-direction:column;gap:16px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2)}
    @media(min-width:760px){ .promo{flex-direction:row;align-items:center;justify-content:space-between} }
    .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:16px;padding:12px 20px;font-weight:600;font-size:14px;transition:all 0.2s ease;text-decoration:none}
    .btn-outline{border:1px solid var(--primary);color:var(--primary);background:transparent}
    .btn-outline:hover{background:var(--primary);color:#052e16}
    .btn-solid{background:var(--primary);color:#052e16;border:1px solid var(--primary)}
    .btn-solid:hover{background:var(--secondary);border-color:var(--secondary)}
    .note{font-size:12px;color:#71717a;text-align:center;margin-top:16px}
    .btn-group{display:flex;gap:12px;flex-wrap:wrap}
    @media(max-width:759px){ .btn-group{flex-direction:column} .btn{width:100%;justify-content:center} }
  </style>
</head>
<body>
  <header>
    ${logoBlock}
    <h1>${businessName} — AI Support Demo</h1>
    <div class="tag">Powered by LocalBoxes • AI Support with ${businessName} Knowledge Base</div>
  </header>

  <main class="container" aria-label="Demo content for ${businessName}">
    <!-- Explainer -->
    <section class="card" aria-labelledby="what-is-this">
      <h2 id="what-is-this" style="margin:0 0 8px;font-size:18px;">What you’re looking at</h2>
      <p class="muted" style="margin:0 0 8px;">
        This page is the <em>live demo shell</em>. In the bottom-right corner, the chat bubble
        is ready to answer questions. It’s built to handle inquiries <em>provide support</em> showcase your business, and share helpful links — open it now and test it yourself!
      </p>
    </section>

    <!-- Features -->
    <section style="margin-top:16px;">
      <div class="grid grid-3">
        <div class="feature"><h3>Instant answers</h3><p>Handles 90–95% of FAQs with a tone and facts tailored to your site.</p></div>
        <div class="feature"><h3>Smart routing</h3><p>Auto-assigns conversations to Support, Sales, Billing, or Tech when needed.</p></div>
        <div class="feature"><h3>Human handoff</h3><p>Agents see full history; the holding AI keeps users updated if humans are busy.</p></div>
        <div class="feature"><h3>Lead capture</h3><p>Collects name/email, tags intent, and enriches context for your CRM.</p></div>
        <div class="feature"><h3>Configurable guardrails</h3><p>Confidence thresholds, escalation timeouts, knowledge sources, and tone.</p></div>
        <div class="feature"><h3>Own your data</h3><p>Self-host option for compliance and control over chat transcripts & analytics.</p></div>
      </div>
    </section>

    <!-- Promo strip -->
    <section style="margin-top:24px;" class="card promo" aria-label="Call to action">
      <div>
        <h3 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#f4f4f5;">Ready to deploy this on your site?</h3>
        <p class="muted" style="margin:0;font-size:14px;">
          We deploy the full stack (AI + routing + CRM) in no time. Self-hosted or managed by us.
        </p>
      </div>
      <div class="btn-group">
        <a href="https://localboxs.com/integration-process" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
          See integration steps
        </a>
        <a href="https://localboxs.com/cost-savings" class="btn btn-solid" target="_blank" rel="noopener noreferrer">
          See cost-savings
        </a>
      </div>
    </section>

     <!-- Sample prompts -->
    <section style="margin-top:16px;" class="card" aria-labelledby="try-prompts">
      <h2 id="try-prompts" style="margin:0 0 10px;font-size:18px;">Try these prompts</h2>
      <ul class="prompts grid grid-2" style="padding-left:18px;">
        <li>"What does ${businessName} do? Give me a 20-second overview."</li>
        <li>"How is your platform different from competitors?"</li>
        <li>"What are your pricing and refund options?"</li>
        <li>"Can you connect me with Sales about partnerships?"</li>
        <li>"Do you have an API and documentation?"</li>
        <li>"What are your business hours and support channels?"</li>
      </ul>
    </section>

    <p class="note" style="margin-top:12px;">
      Privacy note: This demo uses only the knowledge sources configured for your business.
      Unclear queries are escalated—no guesswork.
    </p>
  </main>

  <script>
    window.chatwootSettings = {"position":"right","type":"standard","launcherTitle":"Chat with us"};
    (function(d,t) {
      var BASE_URL = "${chatwootBaseUrl}";
      var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
      g.src = BASE_URL + "/packs/js/sdk.js";
      g.async = true;
      g.crossOrigin = "anonymous"; // Add CORS support
      s.parentNode.insertBefore(g,s);
      g.onload = function() {
        try {
          window.chatwootSDK.run({
            websiteToken: "${websiteToken}",
            baseUrl: BASE_URL
          });
          if (window.$chatwoot && window.$chatwoot.setCustomAttributes) {
            window.$chatwoot.setCustomAttributes({ business: "${businessName}", slug: "${slug}" });
          }
        } catch (error) {
          // Silently handle widget loading errors
        }
      };
      g.onerror = function(error) {
        // Fallback: try to load without CORS
        var fallbackScript = d.createElement(t);
        fallbackScript.src = BASE_URL + "/packs/js/sdk.js";
        fallbackScript.async = true;
        fallbackScript.onload = function() {
          try {
            window.chatwootSDK.run({
              websiteToken: "${websiteToken}",
              baseUrl: BASE_URL
            });
          } catch (fallbackError) {
            // Silently handle fallback errors
          }
        };
        s.parentNode.insertBefore(fallbackScript, s);
      };
    })(document,"script");
  </script>
</body>
</html>`;

  return template;
}
