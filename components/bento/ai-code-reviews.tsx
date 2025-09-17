import type React from "react"

const AiCodeReviews: React.FC = () => {
  const themeVars = {
    "--ai-primary-color": "hsl(var(--primary))",
    "--ai-background-color": "hsl(var(--background))",
    "--ai-text-color": "hsl(var(--foreground))",
    "--ai-text-dark": "hsl(var(--primary-foreground))",
    "--ai-border-color": "hsl(var(--border))",
    "--ai-border-main": "hsl(var(--foreground) / 0.1)",
    "--ai-highlight-primary": "hsl(var(--primary) / 0.12)",
    "--ai-highlight-header": "hsl(var(--accent) / 0.2)",
  }

  return (
    <div
      style={
        {
          width: "100%",
          height: "100%",
          position: "relative",
          background: "transparent",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="AI Code Reviews interface showing code suggestions with apply buttons"
    >
      {/* Background Message Box (Blurred) */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "50%",
          transform: "translateX(-50%) scale(0.9)",
          width: "340px",
          height: "205.949px",
          background: "linear-gradient(180deg, var(--ai-background-color) 0%, transparent 100%)",
          opacity: 0.6,
          borderRadius: "8.826px",
          border: "0.791px solid var(--ai-border-color)",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          className="border rounded-lg bg-card"
          style={{
            padding: "7.355px 8.826px",
            height: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "'Geist Mono', 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: "9.562px",
              lineHeight: "14.711px",
              letterSpacing: "-0.2942px",
              color: "hsl(var(--muted-foreground))",
              width: "100%",
              maxWidth: "320px",
              margin: 0,
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>How It Works</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>

            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>1. Customer Sends a Message</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>User starts a chat on your website.</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>Conversation instantly enters the system.</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>

            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>2. Main AI Agent (95% Accuracy)</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>Knows your platform inside and out.</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Can be trained with any information you want shared.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Handles 95% of questions accurately, instantly.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Escalates to a human team when needed.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>

            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>3. Automatic Team Assignment</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Conversation is routed to the right team:
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Customer Support — general inquiries.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Sales &amp; Partnerships — leads, investors, enterprise.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Technical Support / DevOps — onboarding &amp; integrations.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Billing &amp; Accounts — payments, refunds, invoices.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Product Feedback &amp; Community — feature requests &amp; bug reports.
            </p>
          </div>
        </div>
      </div>

      {/* Foreground Message Box (Main) */}
      <div
        style={{
          position: "absolute",
          top: "51.336px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "340px",
          height: "221.395px",
          background: "var(--ai-background-color)",
          backdropFilter: "blur(16px)",
          borderRadius: "9.488px",
          border: "1px solid var(--ai-border-main)",
          overflow: "hidden",
        }}
      >
        <div
          className="bg-card border border-border"
          style={{
            padding: "9.488px",
            height: "100%",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              width: "100%",
              top: "47.67px",
              height: "33.118px",
              background: "hsl(var(--foreground) / 0.08)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              width: "100%",
              top: "80.791px",
              height: "45.465px",
              background: "var(--ai-highlight-primary)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              fontFamily: "'Geist Mono', 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: "10.279px",
              lineHeight: "15.814px",
              letterSpacing: "-0.3163px",
              color: "var(--ai-text-color)",
              width: "100%",
              maxWidth: "320px",
              position: "relative",
              zIndex: 2,
              margin: 0,
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>4. Human Takes Over</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Agent sees full conversation history.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Customer gets a smooth handoff without repeating themselves.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>

            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>5. Holding AI Agent</p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              If a human doesn&apos;t reply on time, the Holding AI politely reassures the customer:
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              &quot;We haven&apos;t forgotten you — someone will be with you shortly.&quot;
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Prevents frustration and builds trust.
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}></p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap", fontWeight: 400 }}>
              Optional: notifies agents or supervisors in the background if a conversation goes unattended.
            </p>
          </div>

          <button
            style={{
              position: "absolute",
              top: "calc(50% + 29.745px)",
              right: "20px",
              transform: "translateY(-50%)",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3.953px",
              background: "var(--ai-primary-color)",
              color: "var(--ai-text-dark)",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              padding: "3.163px 6.326px",
              borderRadius: "5.535px",
              fontSize: "10.279px",
              lineHeight: "15.814px",
              letterSpacing: "-0.3163px",
              boxShadow:
                "0px 26.093px 7.116px rgba(0, 0, 0, 0), 0px 16.605px 6.326px rgba(0, 0, 0, 0.01), 0px 9.488px 5.535px rgba(0, 0, 0, 0.05), 0px 3.953px 3.953px rgba(0, 0, 0, 0.09), 0px 0.791px 2.372px rgba(0, 0, 0, 0.1)",
            }}
          >
            <span
              style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: 500,
              }}
            >
              Urgent
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AiCodeReviews
