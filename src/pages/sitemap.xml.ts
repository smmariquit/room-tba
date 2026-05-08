import type { APIRoute } from "astro";
import { db } from "../lib/db";
import { buildingsTable, roomsTable } from "../../drizzle/schema";
import { buildingPath, roomPath, slugify, SITE_URL } from "../lib/seo";

type Entry = { loc: string; changefreq?: string; priority?: number };

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlsetXml(entries: Entry[]): string {
  const items = entries
    .map((e) => {
      const parts: string[] = [`    <loc>${xmlEscape(e.loc)}</loc>`];
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (typeof e.priority === "number")
        parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export const GET: APIRoute = async () => {
  const buildings = await db.select().from(buildingsTable);
  const rooms = await db
    .select({ code: roomsTable.room_code })
    .from(roomsTable);

  const entries: Entry[] = [
    { loc: `${SITE_URL}/`, changefreq: "weekly", priority: 1.0 },
    { loc: `${SITE_URL}/buildings`, changefreq: "monthly", priority: 0.8 },
    { loc: `${SITE_URL}/changelog`, changefreq: "monthly", priority: 0.4 },
  ];

  for (const b of buildings) {
    entries.push({
      loc: `${SITE_URL}${buildingPath(b.building_name)}`,
      changefreq: "monthly",
      priority: 0.7,
    });
  }

  const seenRoomSlugs = new Set<string>();
  for (const r of rooms) {
    const slug = slugify(r.code);
    if (seenRoomSlugs.has(slug)) continue;
    seenRoomSlugs.add(slug);
    entries.push({
      loc: `${SITE_URL}${roomPath(r.code)}`,
      changefreq: "monthly",
      priority: 0.6,
    });
  }

  return new Response(urlsetXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
