import type { APIRoute } from "astro";
import { getAllJeepneyRoutes } from "@lib/services/transit-service";
import { getAllPlaces } from "@lib/services/map-data-service";
import {
  renderTransitMapPdf,
  type TransitMapFormat,
} from "@lib/transit-map-pdf";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Printable transit map: GET /api/transit-map?here=<place id or name>&format=a4|letter
 * `here` is optional; when it matches a place, the PDF marks it "You are here".
 */
export const GET: APIRoute = async ({ url }) => {
  const hereParam = url.searchParams.get("here")?.trim();
  const formatParam = url.searchParams.get("format")?.trim();
  const format: TransitMapFormat = formatParam === "letter" ? "letter" : "a4";

  let here: { name: string; lat: number; lon: number } | null = null;
  if (hereParam) {
    const asId = Number(hereParam);
    const places = await getAllPlaces().catch(() => []);
    // "Riceworld Museum" should match "Riceworld Museum (IRRI)": compare the
    // full name and the bare name with any parenthetical suffix stripped.
    const bare = (name: string) =>
      name
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim()
        .toLowerCase();
    const query = hereParam.toLowerCase();
    const match =
      Number.isInteger(asId) && asId > 0
        ? places.find((p) => p.id === asId)
        : places.find(
            (p) =>
              p.name.trim().toLowerCase() === query ||
              bare(p.name) === query ||
              bare(p.name) === bare(hereParam),
          );
    if (!match || match.lat == null || match.lon == null) {
      return json(
        {
          error: `No mappable place found for "${hereParam}". Open the place in the app and use its Printable map action, or pass its exact name or id.`,
        },
        404,
      );
    }
    here = { name: match.name, lat: match.lat, lon: match.lon };
  }

  try {
    // The service returns fares nested (fare.regular/discounted); the PDF
    // generator expects flat fields.
    const routes = (await getAllJeepneyRoutes()).map((route) => ({
      id: route.id,
      name: route.name,
      color: route.color,
      fareRegular: route.fare?.regular ?? Number.NaN,
      fareDiscounted: route.fare?.discounted ?? Number.NaN,
      directionNote: route.directionNote ?? null,
      stops: route.stops.map((stop) => ({
        name: stop.name,
        lat: stop.lat,
        lon: stop.lon,
      })),
    }));
    const bytes = await renderTransitMapPdf({ routes, here, format });
    const slug = here
      ? `-from-${here.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`
      : "";
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="uplb-transit-map${slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("transit-map PDF failed:", error);
    return json({ error: "Could not render the transit map PDF." }, 500);
  }
};
