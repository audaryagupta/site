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
      { source: "/post/:slug", destination: "/writings/:slug", permanent: true },
      { source: "/blog", destination: "/writings", permanent: true },
      { source: "/blog/:path*", destination: "/writings", permanent: true },
    ];
  },
};

export default nextConfig;
