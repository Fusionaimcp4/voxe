export const SECTION_HEADING = "Proven Outcomes";
export const SECTION_SUBHEAD =
  "Cut first response time by 90%. Shifted 70% of volume to AI. Reduced tooling costs by 60%+.";

export type Testimonial = {
  quote: string;
  name: string;
  company: string;
  title?: string;
  avatar?: string; // local path in /public/avatars
  alt?: string;
};

export const NEW_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Cut first response time by 90%. The AI handles most queries instantly, and our team focuses on complex issues. Game changer.",
    name: "Sarah Chen",
    company: "TechFlow",
    title: "Head of Support",
    avatar: "/images/avatars/maya-chen.png",
    alt: "Portrait of Sarah Chen",
  },
  {
    quote:
      "Shifted 70% of volume to AI. We went from drowning in tickets to proactive customer success. The holding AI ensures no one waits.",
    name: "Marcus Rodriguez",
    company: "DataSync",
    title: "VP Operations",
    avatar: "/images/avatars/Ibrahim-Khalid.png",
    alt: "Portrait of Marcus Rodriguez",
  },
  {
    quote:
      "Reduced tooling costs by 60%+. One-time setup vs. monthly per-seat fees. We're saving thousands monthly while improving service.",
    name: "Jennifer Park",
    company: "CloudScale",
    title: "Founder",
    avatar: "/images/avatars/Sofia-Almeida.png",
    alt: "Portrait of Jennifer Park",
  },
  {
    quote:
      "Finally, we own our customer data. Self-hosting gives us the control and security we need, without being locked into a vendor's ecosystem.",
    name: "Sofia Almeida",
    company: "Trailhead Robotics",
    title: "Software Manager",
    avatar: "/images/avatars/Sofia-Almeida.png",
    alt: "Portrait of Sofia Almeida",
  },
  {
    quote:
      "We were skeptical about a one-time setup fee, but it's paid for itself ten times over. Predictable costs and unlimited agents are exactly what a scaling startup needs.",
    name: "Priya Narayan",
    company: "Nimbus Commerce",
    title: "Engineering Manager",
    avatar: "/images/avatars/Priya-Narayan.png",
    alt: "Portrait of Priya Narayan",
  },
  {
    quote:
      "The seamless escalation from AI to a human agent is incredibly smooth. Our team can jump into conversations with full context, leading to faster, more effective resolutions.",
    name: "Marco Santoro",
    company: "Lumen Health",
    title: "Senior Developer",
    avatar: "/images/avatars/Marco-Santoro.png",
    alt: "Portrait of Marco Santoro",
  },
  {
    quote:
      "Our customer satisfaction scores have jumped 20 points since we implemented Voxe. The AI is fast, accurate, and lets our human agents focus on the really tough problems.",
    name: "Vera Kowalski",
    company: "Bluepeak Logistics",
    title: "SRE Lead",
    avatar: "/images/avatars/Vera-Kowalski.png",
    alt: "Portrait of Vera Kowalski",
  },
  
]
