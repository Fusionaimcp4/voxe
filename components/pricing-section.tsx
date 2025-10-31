import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PricingSection() {

  return (
    <section className="w-full px-5 py-16 md:py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
      {/* Very subtle light background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* ROI Calculator */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Calculate Your Savings
          </h3>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
            See how much you could save by switching from per-agent or per-resolution providers. 
            Most businesses save 60-80% on support costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-10">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">60-80%</div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">∞</div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">Agents & AI Usage</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">0</div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">Per-Seat Fees</div>
            </div>
          </div>
          <Link href="/cost-savings">
            <Button size="lg" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
              Calculate Savings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
