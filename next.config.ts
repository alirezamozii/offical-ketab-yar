import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { sentryBuildOptions } from "./sentry.config";
import { withPayload } from "@payloadcms/next/withPayload";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  productionBrowserSourceMaps: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  outputFileTracingExcludes: {
    '*': ['node:*', 'node:inspector', 'node:crypto'],
  },
  serverExternalPackages: ["node:inspector", "node:crypto", "node:fs", "node:path", "node:util", "node:events", "node:stream"],
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,

  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  allowedDevOrigins: [
    "*.space-z.ai",
    "*.preview.z.ai",
    "localhost",
    "127.0.0.1",
  ],

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  experimental: {
    sri: { algorithm: "sha384" },
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "date-fns",
      "date-fns-jalali",
      "recharts",
      "sonner",
      "next-themes",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-accordion",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "embla-carousel-react",
      "@tanstack/react-query",
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/og/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

const payloadConfigured = withPayload(nextConfig);
const configured = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(payloadConfigured, sentryBuildOptions)
  : payloadConfigured;
const configuredHeaders = configured.headers;

configured.headers = async () => {
  const rules = await configuredHeaders?.() ?? [];
  return rules.map((rule) =>
    rule.source === '/:path*' && rule.headers.some((header) => header.key.toLowerCase() === 'critical-ch')
      ? { ...rule, source: '/admin/:path*' }
      : rule,
  );
};

export default configured;
