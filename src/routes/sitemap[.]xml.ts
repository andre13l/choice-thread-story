import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://nircosi.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/hollywood", changefreq: "weekly", priority: "0.9" },
          { path: "/higher-lower", changefreq: "weekly", priority: "0.8" },
          { path: "/connect", changefreq: "weekly", priority: "0.8" },
          { path: "/daily", changefreq: "daily", priority: "0.9" },
          { path: "/connect/daily", changefreq: "daily", priority: "0.8" },
          { path: "/daily/top-10", changefreq: "daily", priority: "0.8" },
          { path: "/daily/person", changefreq: "daily", priority: "0.8" },
          { path: "/daily/timeline", changefreq: "daily", priority: "0.8" },
          { path: "/daily/up-down", changefreq: "daily", priority: "0.8" },
          { path: "/walk-of-fame", changefreq: "weekly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.4" },
          { path: "/contact", changefreq: "monthly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.2" },
          { path: "/terms", changefreq: "yearly", priority: "0.2" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
