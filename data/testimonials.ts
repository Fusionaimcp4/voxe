export const SECTION_HEADING = "Proven Outcomes";
export const SECTION_SUBHEAD =
  "95%+ customer questions answered automatically. Reduce SaaS spend by up to 80% vs Intercom/Zendesk.";

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
      "Switching to EngageDesk Support was a revelation. Our support costs dropped by 70% in the first quarter, and we're no longer bleeding money on per-seat licenses.",
    name: "Maya Chen",
    company: "Zephyr Analytics",
    title: "Head of Engineering",
    avatar: "/avatars/maya-chen.jpg",
    alt: "Portrait of Maya Chen",
  },
  {
    quote:
      "The Holding AI is brilliant. Our customers never feel ignored, even during peak hours. It's completely eliminated the 'silent wait' problem we had with our old provider.",
    name: "Ibrahim Khalid",
    company: "OrbitPay",
    title: "Platform Lead",
    avatar: "/avatars/ibrahim-khalid.jpg",
    alt: "Portrait of Ibrahim Khalid",
  },
  {
    quote:
      "Finally, we own our customer data. Self-hosting gives us the control and security we need, without being locked into a vendor's ecosystem.",
    name: "Sofia Almeida",
    company: "Trailhead Robotics",
    title: "Software Manager",
    avatar: "/avatars/sofia-almeida.jpg",
    alt: "Portrait of Sofia Almeida",
  },
  {
    quote:
      "Onboarding new support agents used to take weeks. Now, with the AI handling most initial queries, they can focus on high-value interactions from day one.",
    name: "Jules Laurent",
    company: "Cinder Studio",
    title: "CTO",
    avatar: "/avatars/jules-laurent.jpg",
    alt: "Portrait of Jules Laurent",
  },
  {
    quote:
      "We were skeptical about a one-time setup fee, but it's paid for itself ten times over. Predictable costs and unlimited agents are exactly what a scaling startup needs.",
    name: "Priya Narayan",
    company: "Nimbus Commerce",
    title: "Engineering Manager",
    avatar: "/avatars/priya-narayan.jpg",
    alt: "Portrait of Priya Narayan",
  },
  {
    quote:
      "The seamless escalation from AI to a human agent is incredibly smooth. Our team can jump into conversations with full context, leading to faster, more effective resolutions.",
    name: "Marco Santoro",
    company: "Lumen Health",
    title: "Senior Developer",
    avatar: "/avatars/marco-santoro.jpg",
    alt: "Portrait of Marco Santoro",
  },
  {
    quote:
      "Our customer satisfaction scores have jumped 20 points since we implemented Fusion. The AI is fast, accurate, and lets our human agents focus on the really tough problems.",
    name: "Vera Kowalski",
    company: "Bluepeak Logistics",
    title: "SRE Lead",
    avatar: "/avatars/vera-kowalski.jpg",
    alt: "Portrait of Vera Kowalski",
  },
  
]
