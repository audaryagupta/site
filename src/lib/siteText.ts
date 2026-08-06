// Registry of editable, free-text copy shown across the public site. Each field
// maps to a key in the site-content store (the same store the inline "Edit site"
// mode uses), so edits made in Studio → Site text and inline edits stay in sync.
// The public pages/components read these keys via pickStr()/pickText() with the
// same defaults listed here, so unset fields fall back to the built-in copy.

export interface SiteTextField {
  id: string;
  label: string;
  default: string;
  multiline?: boolean;
  help?: string;
}

export interface SiteTextGroup {
  label: string;
  description?: string;
  fields: SiteTextField[];
}

export const HERO_EYEBROW_DEFAULT = "The personal blog of Audarya Gupta";
export const TAGLINE_DEFAULT = "The personal blog of Audarya Gupta";
export const QR_QUOTE_DEFAULT = "Well, you did end up scanning my QR code!";

export const ABOUT_BIO_DEFAULT = `Hi, I’m Audarya — someone who has always been fascinated by the forces that drive economies, shape global affairs, and influence financial markets. My curiosity about finance, geopolitics, and history led me to take a gap year after my 12th grade and go down the exploration road. In the past I've interned at organizations like the Government of India, Hindustan Times, and Gulf News Dubai, gaining insights into finance, media, and governance along the way.

I have an ever-going quest to share whatever knowledge I have. I believe any information that leaves you becomes 2x more useful than it would have been constricted to you — which led me to start The VentureBuz Forum to support students in developing entrepreneurial skills through competitions and business clubs. My passion for finance and problem-solving also led me to author a book.

Apart from these pursuits, I enjoy learning languages — I speak French semi-fluently and am currently learning Spanish and Sanskrit to expand my global perspective. Through this blog, I hope to share my insights on finance, innovation, history, and geopolitics while documenting my journey of continuous learning.

I look forward to engaging with you all. Please don’t hesitate to reach out.`;

export const SITE_TEXT_GROUPS: SiteTextGroup[] = [
  {
    label: "Home — hero",
    description: "The top of the homepage.",
    fields: [
      { id: "home.hero.eyebrow", label: "Eyebrow (small line above the title)", default: HERO_EYEBROW_DEFAULT },
      { id: "home.hero.title", label: "Headline", default: "Ideas worth passing on." },
      {
        id: "home.hero.sub",
        label: "Sub-headline",
        default:
          "Essays, field notes and curated briefings on finance, history, public life, technology and the questions that keep returning.",
        multiline: true,
      },
    ],
  },
  {
    label: "Home — quote card",
    fields: [
      {
        id: "home.quote.text",
        label: "Quote",
        default: "“Any idea that leaves you becomes twice as useful.”",
        multiline: true,
      },
      { id: "home.quote.sub", label: "Quote caption", default: "Notes on economics, ambition and attention" },
    ],
  },
  {
    label: "Home — the three cards",
    fields: [
      { id: "home.card1.title", label: "Card 1 title", default: "Essays" },
      { id: "home.card1.body", label: "Card 1 text", default: "Longer pieces shaped around argument, observation and context.", multiline: true },
      { id: "home.card2.title", label: "Card 2 title", default: "The Weekly Recap" },
      { id: "home.card2.body", label: "Card 2 text", default: "Ten important stories in business, finance and AI — sourced, linked, and approved before send.", multiline: true },
      { id: "home.card3.title", label: "Card 3 title", default: "Appointments" },
      { id: "home.card3.body", label: "Card 3 text", default: "A direct calendar-backed way to request conversations, interviews or collaborations.", multiline: true },
    ],
  },
  {
    label: "Home — latest writing & briefing",
    fields: [
      { id: "home.latest.eyebrow", label: "“Latest writing” eyebrow", default: "Latest writing" },
      { id: "home.latest.heading", label: "Latest writing heading", default: "Read the newest pieces." },
      { id: "home.latest.empty", label: "Text shown when there are no articles", default: "New essays are on the way. Subscribe below to get the first one.", multiline: true },
      { id: "home.topics.eyebrow", label: "“Explore by topic” label", default: "Explore by topic" },
      { id: "home.recap.eyebrow", label: "Briefing eyebrow", default: "Weekly briefing" },
      { id: "home.recap.heading", label: "Briefing heading", default: "The Weekly Recap" },
      { id: "home.recap.body", label: "Briefing text", default: "Every week: ten stories that actually mattered in finance, business and AI — direct links, source images, and a personal note before it goes out.", multiline: true },
    ],
  },
  {
    label: "About",
    fields: [
      { id: "about.eyebrow", label: "Eyebrow", default: "About Me" },
      { id: "about.title", label: "Name / heading", default: "Audarya Gupta" },
      { id: "about.role", label: "Role line", default: "Founder, byAudarya & VentureBuz" },
      { id: "about.bio", label: "The write-up about you", default: ABOUT_BIO_DEFAULT, multiline: true },
      { id: "about.connect.label", label: "Sidebar “Connect” label", default: "Connect" },
      { id: "about.connect.body", label: "Sidebar connect text", default: "Essays, collaborations, speaking requests and appointments start with a simple message.", multiline: true },
      { id: "about.theme1.title", label: "Theme 1 title", default: "Finance" },
      { id: "about.theme1.body", label: "Theme 1 text", default: "Markets, business models, incentives and the stories behind capital.", multiline: true },
      { id: "about.theme2.title", label: "Theme 2 title", default: "Public life" },
      { id: "about.theme2.body", label: "Theme 2 text", default: "Governance, institutions and the ideas that shape decisions.", multiline: true },
      { id: "about.theme3.title", label: "Theme 3 title", default: "Writing" },
      { id: "about.theme3.body", label: "Theme 3 text", default: "Turning research and observation into essays people can return to.", multiline: true },
    ],
  },
  {
    label: "Contact",
    fields: [
      { id: "contact.eyebrow", label: "Eyebrow", default: "Contact" },
      { id: "contact.title", label: "Headline", default: "Let's turn a good idea into a conversation." },
      { id: "contact.sub", label: "Sub-headline", default: "Whether it's a collaboration, a question, an interview, or a calendar request — send the context and I'll reply from there.", multiline: true },
      { id: "contact.apptButton", label: "“Request time” button", default: "Request time" },
      { id: "contact.before.label", label: "“Before you write” label", default: "Before you write" },
      { id: "contact.before.body", label: "“Before you write” text", default: "Send the context: what you want to discuss, why it matters, and what a useful outcome would look like.", multiline: true },
      { id: "contact.chip1", label: "Chip 1", default: "Editorial" },
      { id: "contact.chip2", label: "Chip 2", default: "Business" },
      { id: "contact.chip3", label: "Chip 3", default: "Speaking" },
      { id: "contact.message.heading", label: "Message form heading", default: "Send a message" },
      { id: "contact.message.sub", label: "Message form sub-text", default: "I read everything that comes in." },
      { id: "contact.book.heading", label: "Booking heading", default: "Book an appointment" },
      { id: "contact.book.body", label: "Booking text", default: "Request a Google Meet, Zoom, or in-person meeting. Name, email, phone with country code, purpose, date, time and CAPTCHA are required so invitations and updates reach the right person.", multiline: true },
      { id: "contact.bookButton", label: "“Make an appointment” button", default: "Make an appointment" },
      { id: "contact.location", label: "Location line", default: "New Delhi, India" },
    ],
  },
  {
    label: "Newsletter",
    fields: [
      { id: "newsletter.eyebrow", label: "Eyebrow", default: "The Weekly Recap" },
      { id: "newsletter.title", label: "Headline", default: "Ten stories. Five minutes. Every week." },
      { id: "newsletter.sub", label: "Sub-headline", default: "A curated recap of the week's most important news in finance, business and technology — internationally and in the United States — delivered as a clean, clickable digest with a personal note.", multiline: true },
      { id: "newsletter.disclaimer", label: "Line under the sign-up box", default: "No spam. Unsubscribe anytime with one click." },
      { id: "newsletter.past.heading", label: "“Past issues” heading", default: "Past issues" },
    ],
  },
  {
    label: "Writings list",
    fields: [
      { id: "writings.title", label: "Heading", default: "My Writings" },
      { id: "writings.sub", label: "Sub-heading", default: "Long and short-form thinking on the forces that shape economies, technology and the world.", multiline: true },
      { id: "writings.empty", label: "Empty state text", default: "Nothing here yet — check back soon." },
    ],
  },
  {
    label: "404 (page not found)",
    fields: [
      { id: "notfound.heading", label: "Heading", default: "Looks like this page wandered off into the desert." },
      { id: "notfound.body", label: "Text", default: "The link you followed doesn't exist (anymore). No pressure — play a round of tic-tac-toe against the house while you decide where to head next.", multiline: true },
      { id: "notfound.homeButton", label: "Home button label", default: "Back to homepage" },
      { id: "notfound.writingsButton", label: "Writings button label", default: "Read the writings" },
    ],
  },
  {
    label: "Footer",
    fields: [
      { id: "footer.explore.heading", label: "“Explore” column heading", default: "Explore" },
      { id: "footer.recap.heading", label: "Recap column heading", default: "The Weekly Recap" },
      { id: "footer.recap.body", label: "Recap column text", default: "The week's ten best stories in finance, business & tech — curated, every week.", multiline: true },
    ],
  },
  {
    label: "Global",
    description: "Copy that appears in more than one place.",
    fields: [
      {
        id: "global.tagline",
        label: "Tagline (footer + QR page)",
        default: TAGLINE_DEFAULT,
        help: "Shown under the logo in the footer and on the /qr link page.",
      },
    ],
  },
  {
    label: "QR / link page",
    fields: [
      {
        id: "qr.quote",
        label: "Playful line at the top of /qr",
        default: QR_QUOTE_DEFAULT,
        multiline: true,
      },
    ],
  },
];

export const SITE_TEXT_FIELDS: SiteTextField[] = SITE_TEXT_GROUPS.flatMap(
  (g) => g.fields
);
