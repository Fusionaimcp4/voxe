import type { Metadata } from "next"
import { Header } from "@/components/header"
import { FooterSection } from "@/components/footer-section"

export const metadata: Metadata = {
  title: "Voxe Help Center — Learn how to use your AI-powered support system",
  description:
    "Comprehensive help documentation for Voxe. Learn how to create demos, manage knowledge bases, configure workflows, set up integrations, and troubleshoot issues.",
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      {/* Main Header */}
      <Header />

      {/* Banner */}
      

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </div>

      {/* Main Footer */}
      <FooterSection />
    </div>
  )
}

