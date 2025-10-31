import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { SocialProof } from "@/components/social-proof"
import { ValuePropositionSection } from "@/components/value-proposition-section"
import { BentoSection } from "@/components/bento-section"
import { FeaturesGrid } from "@/components/features-grid"
import { ComparisonPanel } from "@/components/comparison-panel"
import { LargeTestimonial } from "@/components/large-testimonial"
import { PricingSection } from "@/components/pricing-section"
import { SecurityOwnershipSection } from "@/components/security-ownership-section"
import { TestimonialGridSection } from "@/components/testimonial-grid-section"
import { CTASection } from "@/components/cta-section"
import { FooterSection } from "@/components/footer-section"
import { AnimatedSection } from "@/components/animated-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 relative overflow-hidden overflow-x-hidden">
      <div className="relative z-10">
        <main className="w-full relative">
          <HeroSection />
          {/* Dashboard Preview Wrapper - Mobile optimized */}
          <div className="absolute bottom-[-160px] sm:bottom-[-150px] md:bottom-[-480px] left-1/2 transform -translate-x-1/2 z-30 w-[95%] sm:w-[90%] md:w-auto">
            <AnimatedSection>
              <DashboardPreview />
            </AnimatedSection>
          </div>
        </main>
        <AnimatedSection className="relative z-10 mt-[250px] sm:mt-[300px] md:mt-[450px] lg:mt-[500px]" delay={0.1}>
          <SocialProof />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-12" delay={0.2}>
          <ValuePropositionSection />
        </AnimatedSection>
        <AnimatedSection id="features-section" className="relative z-10 py-8 md:py-12" delay={0.2}>
          <BentoSection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-12" delay={0.2}>
          <FeaturesGrid />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-12" delay={0.2}>
          <ComparisonPanel />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-16" delay={0.2}>
          <LargeTestimonial />
        </AnimatedSection>
        <AnimatedSection
          id="pricing-section"
          className="relative z-10 py-8 md:py-16"
          delay={0.2}
        >
          <PricingSection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-16" delay={0.2}>
          <SecurityOwnershipSection />
        </AnimatedSection>
        <AnimatedSection
          id="testimonials-section"
          className="relative z-10 py-8 md:py-16"
          delay={0.2}
        >
          <TestimonialGridSection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-16" delay={0.2}>
          <CTASection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 py-8 md:py-16" delay={0.2}>
          <FooterSection />
        </AnimatedSection>
      </div>
    </div>
  )
}