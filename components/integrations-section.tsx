export function IntegrationsSection() {
  const integrations = [
    { name: "Email", icon: "📧" },
    { name: "Chat Widget", icon: "💬" },
    { name: "Phone", icon: "📞" },
    { name: "Status Page", icon: "📊" },
    { name: "CRM", icon: "👥" },
    { name: "Analytics", icon: "📈" },
    { name: "Billing", icon: "💳" },
    { name: "Slack", icon: "💼" },
    { name: "Teams", icon: "🔗" },
    { name: "Webhook", icon: "🔗" },
    { name: "API", icon: "⚡" },
    { name: "Zapier", icon: "🔌" }
  ]

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Integrations
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight">
            Connect with your existing tools and workflows
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {integrations.map((integration, index) => (
            <div key={index} className="p-4 rounded-lg border border-border bg-card/50 text-center hover:bg-card/80 transition-colors">
              <div className="text-2xl mb-2">{integration.icon}</div>
              <div className="text-sm font-medium text-foreground">{integration.name}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">Open APIs and no-code workflow hooks</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-3 py-1 bg-muted/50 rounded-full">REST API</span>
            <span className="px-3 py-1 bg-muted/50 rounded-full">Webhooks</span>
            <span className="px-3 py-1 bg-muted/50 rounded-full">Zapier</span>
            <span className="px-3 py-1 bg-muted/50 rounded-full">n8n</span>
            <span className="px-3 py-1 bg-muted/50 rounded-full">Custom Apps</span>
          </div>
        </div>
      </div>
    </section>
  )
}
