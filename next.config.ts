import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from guessing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block the page from loading in a frame (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop passing the full referrer URL to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Basic XSS filter (legacy browsers) — CSP is the real protection
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Only send cookies over HTTPS in production
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  // Permissions policy — disable features this app doesn't need
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Crash the build if any page has a type error — catches issues before deploy
  typescript: { ignoreBuildErrors: false },


  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Reduce information leakage — remove the "x-powered-by: Next.js" header
  poweredByHeader: false,
};

export default nextConfig;
