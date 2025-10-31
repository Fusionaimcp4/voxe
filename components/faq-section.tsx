"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqData = [
  {
    q: "Is WhatsApp Business available in Ethiopia?",
    a: "Yes, we support WhatsApp Business API integration for Ethiopian businesses. We help you get approved and set up the integration.",
  },
  {
    q: "How long does onboarding take?",
    a: "Basic setup takes 2-3 days. Full configuration with AI training takes 1-2 weeks. We provide free onboarding and training.",
  },
  {
    q: "What training and support do you provide?",
    a: "Free onboarding, video tutorials, documentation, and email support. Optional training sessions available. Support team in Ethiopia.",
  },
  {
    q: "Where can I host my data?",
    a: "Your choice - our managed hosting in Ethiopia/Kenya, or your own infrastructure. We help you choose the best option for your needs.",
  },
  {
    q: "What languages do you support?",
    a: "Amharic, English, and 20+ other languages. AI responses adapt to customer language automatically.",
  },
  {
    q: "Can I migrate from my current system?",
    a: "Yes, we help import contacts, conversation history, and configurations from most platforms. Migration is included in onboarding.",
  },
  {
    q: "What happens if I want to leave?",
    a: "Export all your data anytime. No contracts, no penalties, no lock-in. We believe in earning your business every day.",
  },
  {
    q: "Do you offer custom integrations?",
    a: "Yes, we can integrate with your existing CRM, ERP, or other business systems. Custom integrations are included in our plans.",
  },
]

interface FAQItemProps {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ q, a, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onToggle()
  }
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-[10px] outline outline-1 outline-border outline-offset-[-1px] transition-all duration-500 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 break-words">{q}</div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground-dark transition-all duration-500 ease-out ${isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${isOpen ? "pb-[18px] pt-2 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
        >
          <div className="text-foreground/80 text-sm font-normal leading-6 break-words">{a}</div>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  return (
    <section className="w-full pt-[66px] pb-20 md:pb-40 px-5 relative flex flex-col justify-center items-center">
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0" />
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-14 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="w-full max-w-[435px] text-center text-foreground text-4xl font-semibold leading-10 break-words">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-[18.20px] break-words">
            Here are some of the most common questions we get.
          </p>
        </div>
      </div>
      <div className="w-full max-w-[600px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-4 relative z-10">
        {faqData.map((faq, index) => (
          <FAQItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
        ))}
      </div>
    </section>
  )
}
