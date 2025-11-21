export const footerConfig = {
  tagline: "AI-support without per-seat or per-resolution fees",
  copyright: `© ${new Date().getFullYear()} Voxe. All rights reserved.`,
  microcopy: "Built with care for teams that value ownership",
} as const

export type SocialLink = { label: string; href: string; icon: "Twitter" | "Github" | "Linkedin" | "MessageCircle" }
export const socialLinks: ReadonlyArray<SocialLink> = [
  { label: "Twitter", href: "#", icon: "Twitter" },
  { label: "GitHub", href: "#", icon: "Github" },
  { label: "LinkedIn", href: "#", icon: "Linkedin" },
] as const

export type FooterLink = { label: string; href: string; external?: boolean }
export type FooterLinkGroup = { title: string; links: ReadonlyArray<FooterLink> }
export const footerLinkGroups: ReadonlyArray<FooterLinkGroup> = [
  {
    title: "Product",
    links: [
      { label: "Demo", href: "/dashboard/userdemo" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Features", href: "/#features" },
      { label: "Integration", href: "/integration-process" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "About", href: "/#about" },
      { label: "Affiliate Program", href: "/affiliate" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Blog", href: "https://mcp4.ai/blog", external: true },
      
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
] as const


