export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "byAudarya",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  tagline: "The personal blog of Audarya Gupta",
  description:
    "Essays, dispatches and curiosities about the world and everything in it — the personal writings of Audarya Gupta.",
  author: "Audarya Gupta",
  email: "audarya@venturebuz.com",
  nav: [
    { href: "/", label: "Home" },
    { href: "/writings", label: "My Writings" },
    { href: "/reading", label: "Now" },
    { href: "/newsletter", label: "Newsletter" },
    { href: "/about", label: "About Me" },
    { href: "/contact", label: "Contact" },
  ],
  socials: [
    { label: "YouTube", href: "https://www.youtube.com/@audaryagupta", key: "youtube" },
    { label: "Instagram", href: "https://www.instagram.com/audaryagupta", key: "instagram" },
    { label: "X", href: "https://twitter.com", key: "x" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/audarya-gupta", key: "linkedin" },
  ],
};

// Default topics/tags used for the writings filter. These are seeds; the admin
// can create more when publishing.
export const defaultTopics = [
  "Finance & Economics",
  "Business & Startups",
  "Technology",
  "Politics & Policy",
  "Personal Essays",
  "Book Reviews",
  "Travel & Food",
];

export type SiteConfig = typeof site;
