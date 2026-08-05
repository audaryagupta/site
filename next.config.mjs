/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Preserve SEO from the previous Wix site: its indexed URLs 301 to the new
  // structure so existing links and search rankings carry over. Article slugs
  // are kept identical (/post/<slug> -> /writings/<slug>).
  async redirects() {
    return [
      // Canonicalise the bare apex to www so there's a single indexed host.
      {
        source: "/:path*",
        has: [{ type: "host", value: "byaudarya.com" }],
        destination: "https://www.byaudarya.com/:path*",
        permanent: true,
      },
      { source: "/post/:slug", destination: "/writings/:slug", permanent: true },
      { source: "/blog", destination: "/writings", permanent: true },
      { source: "/blog/:path*", destination: "/writings", permanent: true },
      // The public link hub (linktree-style) lives at /qr.
      { source: "/links", destination: "/qr", permanent: true },
    ];
  },
};

export default nextConfig;
