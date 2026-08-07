import { site } from "@/lib/site";

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLd = { [key: string]: JsonLdValue };

/** Absolute URL for a site-relative path, honouring the canonical host. */
export function absoluteUrl(path = ""): string {
  const base = site.url.replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Person entity for Audarya Gupta, reused across pages. */
export function personSchema(): JsonLd {
  return {
    "@type": "Person",
    "@id": `${absoluteUrl()}/#person`,
    name: site.author,
    url: absoluteUrl(),
    email: `mailto:${site.email}`,
    jobTitle: "Writer",
    sameAs: site.socials.map((s) => s.href),
  };
}

/** WebSite entity with a search action for sitelinks search box. */
export function websiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${absoluteUrl()}/#website`,
    url: absoluteUrl(),
    name: site.name,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": `${absoluteUrl()}/#person` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/writings")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type ArticleSchemaInput = {
  title: string;
  description?: string | null;
  slug: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  coverImage?: string | null;
};

/** BlogPosting entity for an individual article. */
export function articleSchema(a: ArticleSchemaInput): JsonLd {
  const url = absoluteUrl(`/writings/${a.slug}`);
  const toIso = (d?: Date | string | null): string | null =>
    d ? new Date(d).toISOString() : null;
  const published = toIso(a.publishedAt);
  const modified = toIso(a.updatedAt) || published;

  const schema: JsonLd = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: a.title,
    url,
    mainEntityOfPage: url,
    author: { "@id": `${absoluteUrl()}/#person` },
    publisher: { "@id": `${absoluteUrl()}/#person` },
    inLanguage: "en",
  };
  if (a.description) schema.description = a.description;
  if (published) schema.datePublished = published;
  if (modified) schema.dateModified = modified;
  if (a.coverImage) {
    schema.image = a.coverImage.startsWith("http")
      ? a.coverImage
      : absoluteUrl(a.coverImage);
  }
  return schema;
}

/** Serialise one or more schema objects into a @graph document. */
export function jsonLdGraph(...nodes: JsonLd[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  });
}
