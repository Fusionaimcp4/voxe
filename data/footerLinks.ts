export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "Demo", href: "/userdemo" },
      { label: "API Docs", href: "/docs", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog / Resources", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press Kit", href: "/press" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security / Compliance", href: "/security" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Status Page", href: "https://status.voxe.mcp4.ai", external: true },
      { label: "Community / Discord", href: "https://discord.gg/voxe", external: true },
      { label: "Migration Guide", href: "/migration" },
    ],
  },
];

export const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/voxe",
    icon: "Linkedin",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/voxe_ai",
    icon: "Twitter",
  },
  {
    label: "GitHub",
    href: "https://github.com/voxe-ai",
    icon: "Github",
  },
  {
    label: "Discord",
    href: "https://discord.gg/voxe",
    icon: "MessageCircle",
  },
];

export const footerConfig = {
  tagline: "Own your AI Agent and Helpdesk. Unlimited seats. Unlimited AI. No per-resolution fees.",
  copyright: `© ${new Date().getFullYear()} Voxe. All rights reserved.`,
  microcopy: "Made with ❤️",
};
