export const footerConfig = {
  tagline: "AI-support without per-seat or per-resolution fees",
  copyright: `© ${new Date().getFullYear()} LocalBoxs. All rights reserved.`,
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
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "About", href: "/#about" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#", external: true },
      { label: "Blog", href: "https://chatwoot.mcp4.ai/hc/installation/en/categories/getting-started", external: true },
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


