import { headers } from "next/headers";

// Host-aware robots.txt: the studio subdomain is fully disallowed (never
// crawled or advertised), while the public site stays crawlable.
export function GET() {
  const host = (headers().get("host") || "").toLowerCase().split(":")[0];
  const studioHost = (process.env.NEXT_PUBLIC_STUDIO_HOST || "")
    .toLowerCase()
    .trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";

  const isStudio = Boolean(studioHost) && host === studioHost;

  const body = isStudio
    ? `User-agent: *
Disallow: /
`
    : `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
${site ? `Sitemap: ${site.replace(/\/$/, "")}/sitemap.xml` : ""}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
