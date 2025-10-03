import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ComparisonSection() {
  const comparisonData = [
    {
      capability: "Pricing model",
      voxe: "Flat/self-hosted",
      competitor: "Per-seat + per-resolution ($0.99/resolution + $29/seat/mo)"
    },
    {
      capability: "Data ownership",
      voxe: "Yours (self-hosted/managed-hosted)",
      competitor: "Vendor cloud"
    },
    {
      capability: "AI resolutions",
      voxe: "Unlimited",
      competitor: "Metered"
    },
    {
      capability: "Seats",
      voxe: "Unlimited",
      competitor: "Per-agent billed"
    },
    {
      capability: "Hybrid orchestration",
      voxe: "Built-in with Holding AI + Supervisor alerts",
      competitor: "Varies by add-ons"
    },
    {
      capability: "Lock-in",
      voxe: "None",
      competitor: "High (ecosystem + pricing)"
    },
    {
      capability: "Time-to-value",
      voxe: "Days with guided setup",
      competitor: "Weeks coordinating add-ons"
    },
    {
      capability: "Total cost year-over-year",
      voxe: "Predictable",
      competitor: "Scales with headcount + volume"
    }
  ]

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-8 md:py-14">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-2 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Why Voxe over Intercom/Zendesk
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-tight">
            Self-hosted or managed-hosted flips the economics and privacy equation entirely.
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-4xl mx-auto mt-10">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center">Capability Comparison</CardTitle>
            <CardDescription className="text-center">
              See how Voxe's self-hosted approach changes the game
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-foreground">Capability</th>
                    <th className="text-left p-4 font-medium text-primary">Voxe</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Intercom/Zendesk-style SaaS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="p-4 font-medium text-foreground">{row.capability}</td>
                      <td className="p-4 text-primary font-medium">{row.voxe}</td>
                      <td className="p-4 text-muted-foreground">{row.competitor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
