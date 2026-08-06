// Registry of editable, free-text copy shown across the public site. Each field
// maps to a key in the site-content store (the same store the inline "Edit site"
// mode uses), so edits made in Studio → Site text and inline edits stay in sync.
// The public pages/components read these keys via pickText() with the same
// defaults listed here, so unset fields fall back to the built-in copy.

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
    label: "About",
    fields: [
      { id: "about.title", label: "Name / heading", default: "Audarya Gupta" },
      { id: "about.role", label: "Role line", default: "Founder, byAudarya & VentureBuz" },
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
