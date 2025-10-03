export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Connect",
      description: "Import your help center/CRM data and channels.",
      details: "Seamlessly integrate with your existing systems and data sources."
    },
    {
      number: "2", 
      title: "Configure",
      description: "Set routing rules, SLAs, and escalation timers.",
      details: "Customize AI behavior and human handoff triggers to match your workflow."
    },
    {
      number: "3",
      title: "Go Live", 
      description: "AI handles ~95%; humans focus on priority issues.",
      details: "Deploy instantly with AI handling most queries while humans tackle complex cases."
    },
    {
      number: "4",
      title: "Improve",
      description: "Review insights; tune prompts, macros, and workflows.",
      details: "Continuously optimize based on performance data and customer feedback."
    }
  ]

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            How It Works
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight">
            Get up and running in days, not weeks
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border transform translate-x-4"></div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground font-medium">{step.description}</p>
                  <p className="text-sm text-muted-foreground">{step.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
