export function SecurityControlSection() {
  const features = [
    {
      title: "Data Residency Options",
      description: "Choose where your data lives - your infrastructure or Voxe managed hosting with isolation."
    },
    {
      title: "Least-Privilege Access", 
      description: "Granular permissions and role-based access control for your team."
    },
    {
      title: "Audit Logs",
      description: "Complete visibility into all system activities and user interactions."
    },
    {
      title: "Clear Export Paths",
      description: "Easy data export and migration - no vendor lock-in, ever."
    },
    {
      title: "BYO LLM Keys",
      description: "Optional: Bring your own API keys for maximum control over AI models."
    },
    {
      title: "Infrastructure Ownership",
      description: "Self-hosted option gives you complete control over your customer data."
    }
  ]

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Security & Control
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight">
            Own your infrastructure or use Voxe managed hosting with isolation
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg border border-border bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <span className="text-primary font-medium">🔒</span>
            <span className="text-sm text-muted-foreground">
              Clear export paths; BYO LLM keys optional
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
