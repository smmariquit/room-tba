/**
 * Printable transit map PDF for the UPLB jeepney routes.
 *
 * Schematic style (like a bus diagram): routes are smooth curves through their
 * ordered stops, not road-snapped geometry — the database stores stop order,
 * not polylines, and a diagram stays readable at A4 print size.
 *
 * Accessibility: all text is real PDF text (selectable, screen-reader
 * reachable), body copy is >= 7.5pt with a white halo over line work, route
 * identity never relies on color alone (names + fares sit in the legend), and
 * the document carries Title/Author/Language metadata.
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

export type TransitMapStop = { name: string; lat: number; lon: number };

export type TransitMapRoute = {
  id: string;
  name: string;
  color: string;
  fareRegular: number;
  fareDiscounted: number;
  directionNote: string | null;
  stops: TransitMapStop[];
};

export type TransitMapHere = { name: string; lat: number; lon: number };

export type TransitMapFormat = "a4" | "letter";

const PAGE_SIZES: Record<TransitMapFormat, { w: number; h: number }> = {
  a4: { w: 841.89, h: 595.28 },
  letter: { w: 792, h: 612 },
};

const BRAND = rgb(0.553, 0.078, 0.216); // #8d1437
const INK = rgb(0.102, 0.102, 0.102); // #1a1a1a
const MUTED = rgb(0.42, 0.42, 0.42);
const HAIRLINE = rgb(0.85, 0.85, 0.85);
const WHITE = rgb(1, 1, 1);

const MARGIN = 40;
const HEADER_H = 58;
const FOOTER_H = 26;
const LEGEND_H = 88;
const FRAME_PAD = 14;

/** Meters per degree of longitude at the campus latitude (~14.17 N). */
export function metersPerDegreeLon(latDeg: number): number {
  return 111320 * Math.cos((latDeg * Math.PI) / 180);
}

export type ProjectedPoint = { x: number; y: number };

/**
 * Local equirectangular projection fitted to the map frame, preserving
 * aspect. Returns a projector plus the scale (pt per meter) for the scale bar.
 */
export function makeProjector(
  points: { lat: number; lon: number }[],
  frame: { x: number; y: number; w: number; h: number },
): {
  project: (lat: number, lon: number) => ProjectedPoint;
  ptPerMeter: number;
} | null {
  if (points.length === 0) return null;
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const mPerDegLon = metersPerDegreeLon(lat0);
  const xs = points.map((p) => (p.lon - 0) * mPerDegLon);
  const ys = points.map((p) => p.lat * 111320);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  // 8% breathing room so edge stops/labels are not clipped by the frame.
  const padX = spanX * 0.08;
  const padY = spanY * 0.08;
  const scaleX = frame.w / (spanX + padX * 2);
  const scaleY = frame.h / (spanY + padY * 2);
  const scale = Math.min(scaleX, scaleY);
  const offX = frame.x + (frame.w - spanX * scale) / 2;
  const offY = frame.y + (frame.h - spanY * scale) / 2;
  return {
    ptPerMeter: scale,
    project: (lat, lon) => ({
      x: offX + (lon * mPerDegLon - minX + padX) * scale,
      y: offY + (lat * 111320 - minY + padY) * scale,
    }),
  };
}

/** Smooth SVG path through points: quadratic curves via segment midpoints. */
export function smoothPath(points: ProjectedPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const f = (n: number) => Number(n.toFixed(2));
  let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${f(points[i].x)} ${f(points[i].y)} ${f(mx)} ${f(my)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${f(last.x)} ${f(last.y)}`;
  return d;
}

/** Five-point star path (pointing up) as SVG, centered on (cx, cy). */
export function starPath(cx: number, cy: number, r: number): string {
  const f = (n: number) => Number(n.toFixed(2));
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${f(cx + rr * Math.cos(rad))} ${f(cy + rr * Math.sin(rad))}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/** Round to a human scale bar length (m) that fits `maxMeters`. */
export function niceScaleBarMeters(maxMeters: number): number {
  const candidates = [50, 100, 200, 250, 500, 1000, 2000];
  let best = candidates[0];
  for (const c of candidates) if (c <= maxMeters) best = c;
  return best;
}

type LabelCell = { x: number; y: number };

/** Grid occupancy so stop labels do not overlap each other or the star. */
class LabelGrid {
  private cells = new Set<string>();
  constructor(
    private cellW = 100,
    private cellH = 14,
  ) {}
  private key(x: number, y: number) {
    return `${Math.floor(x / this.cellW)}:${Math.floor(y / this.cellH)}`;
  }
  free(x: number, y: number) {
    return !this.cells.has(this.key(x, y));
  }
  claim(x: number, y: number) {
    this.cells.add(this.key(x, y));
  }
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return rgb(0.2, 0.2, 0.2);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const WINANSI_REPLACEMENTS: [RegExp, string][] = [
  [/\u2192/g, "->"], // → rightwards arrow
  [/\u2190/g, "<-"], // ← leftwards arrow
  [/\u2194/g, "<->"], // ↔ left-right arrow
  [/\u21d2/g, "=>"], // ⇒ double arrow
  [/\u2264/g, "<="],
  [/\u2265/g, ">="],
  [/\u2022/g, "-"],
  [/\u00a0/g, " "],
];

/** Standard PDF fonts are WinAnsi; live data (route names like
 *  "Buendia → Los Baños") carries characters it cannot encode. Map the
 *  common typography and drop whatever is left rather than failing the print. */
export function toWinAnsi(text: string): string {
  let out = text;
  for (const [pattern, replacement] of WINANSI_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping unencodable codepoints is the point
  return out.replace(
    /[^\t\n\r\x20-\x7E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/g,
    "",
  );
}

/** Routes drawn on the diagram must live inside the campus frame; intercity
 *  services (Manila, Calamba, Sta. Cruz…) stay in the legend as text. */
const CAMPUS_FRAME = {
  minLat: 14.1,
  maxLat: 14.2,
  minLon: 121.2,
  maxLon: 121.28,
};

export function isCampusScopeRoute(route: TransitMapRoute): boolean {
  return (
    route.stops.length >= 2 &&
    route.stops.every(
      (s) =>
        s.lat >= CAMPUS_FRAME.minLat &&
        s.lat <= CAMPUS_FRAME.maxLat &&
        s.lon >= CAMPUS_FRAME.minLon &&
        s.lon <= CAMPUS_FRAME.maxLon,
    )
  );
}

/** White "halo" under dark text keeps labels readable over line work. */
function haloText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  color = INK,
  halo = WHITE,
) {
  page.drawText(text, { x, y, size, font, color: halo });
  for (const [dx, dy] of [
    [0.5, 0],
    [-0.5, 0],
    [0, 0.5],
    [0, -0.5],
  ]) {
    page.drawText(text, { x: x + dx, y: y + dy, size, font, color: halo });
  }
  page.drawText(text, { x, y, size, font, color });
}

export async function renderTransitMapPdf(input: {
  routes: TransitMapRoute[];
  here?: TransitMapHere | null;
  format?: TransitMapFormat;
  generatedAt?: Date;
}): Promise<Uint8Array> {
  const format = input.format ?? "a4";
  const { w: pageW, h: pageH } = PAGE_SIZES[format];
  const generatedAt = input.generatedAt ?? new Date();

  const pdf = await PDFDocument.create();
  pdf.setTitle("UPLB Transit Map — Jeepney Routes");
  pdf.setAuthor("Room TBA");
  pdf.setSubject("Printable map of UPLB jeepney routes and stops");
  pdf.setCreator("Room TBA (room-tba.uplb.tools)");
  pdf.setCreationDate(generatedAt);

  const page = pdf.addPage([pageW, pageH]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Sanitize once at the boundary: live data carries characters the standard
  // PDF fonts cannot encode (route names like "Buendia → Los Baños").
  const routes = input.routes.map((route) => ({
    ...route,
    name: toWinAnsi(route.name),
    directionNote: route.directionNote ? toWinAnsi(route.directionNote) : null,
    stops: route.stops.map((stop) => ({ ...stop, name: toWinAnsi(stop.name) })),
  }));
  const drawnRoutes = routes.filter(isCampusScopeRoute);
  const intercityRoutes = routes.filter((r) => !isCampusScopeRoute(r));
  const here = input.here
    ? {
        name: toWinAnsi(input.here.name),
        lat: input.here.lat,
        lon: input.here.lon,
      }
    : null;
  const hereOnFrame =
    here !== null &&
    here.lat >= CAMPUS_FRAME.minLat &&
    here.lat <= CAMPUS_FRAME.maxLat &&
    here.lon >= CAMPUS_FRAME.minLon &&
    here.lon <= CAMPUS_FRAME.maxLon;

  // ── Header ────────────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: pageH - HEADER_H,
    width: pageW,
    height: HEADER_H,
    color: WHITE,
  });
  page.drawRectangle({
    x: 0,
    y: pageH - HEADER_H,
    width: pageW,
    height: 3,
    color: BRAND,
  });
  page.drawText("UPLB Jeepney Routes", {
    x: MARGIN,
    y: pageH - 30,
    size: 18,
    font: bold,
    color: INK,
  });
  const dateLabel = generatedAt.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(`Printable transit map · generated ${dateLabel}`, {
    x: MARGIN,
    y: pageH - 46,
    size: 9,
    font,
    color: MUTED,
  });

  // ── Map frame ─────────────────────────────────────────────────────────
  const frame = {
    x: MARGIN,
    y: FOOTER_H + LEGEND_H + 10,
    w: pageW - MARGIN * 2,
    h: pageH - HEADER_H - 12 - LEGEND_H - 10 - FOOTER_H - 10,
  };
  page.drawRectangle({
    x: frame.x,
    y: frame.y,
    width: frame.w,
    height: frame.h,
    color: WHITE,
    borderColor: HAIRLINE,
    borderWidth: 1,
  });

  const allStops = drawnRoutes.flatMap((r) => r.stops);
  const projInput = here && hereOnFrame ? [...allStops, here] : allStops;
  const projector = makeProjector(projInput, {
    x: frame.x + FRAME_PAD,
    y: frame.y + FRAME_PAD,
    w: frame.w - FRAME_PAD * 2,
    h: frame.h - FRAME_PAD * 2,
  });

  const grid = new LabelGrid();

  // pdf-lib's drawSvgPath follows SVG's y-down convention from its anchor;
  // anchoring at the page top and flipping every point keeps the projector
  // in ordinary PDF space (y-up) while line work lands where intended.
  const toSvg = (p: ProjectedPoint): ProjectedPoint => ({
    x: p.x,
    y: pageH - p.y,
  });
  const svgPathFrom = (pts: ProjectedPoint[]) => smoothPath(pts.map(toSvg));
  const starAt = (cx: number, cy: number, r: number) =>
    starPath(cx, pageH - cy, r);
  const svgAnchor = { x: 0, y: pageH };

  if (projector && allStops.length > 0) {
    const { project, ptPerMeter } = projector;

    // Routes: white casing under colored line, both round-capped.
    for (const route of drawnRoutes) {
      if (route.stops.length < 2) continue;
      const pts = route.stops.map((s) => project(s.lat, s.lon));
      const d = svgPathFrom(pts);
      const color = hexToRgb(route.color);
      page.drawSvgPath(d, {
        ...svgAnchor,
        borderColor: WHITE,
        borderWidth: 7,
        borderLineCap: 1,
        borderLineJoin: 1,
      });
      page.drawSvgPath(d, {
        ...svgAnchor,
        borderColor: color,
        borderWidth: 4.5,
        borderLineCap: 1,
        borderLineJoin: 1,
      });
    }

    // Stops: white dot with route-color ring; labels alternate sides.
    for (const route of drawnRoutes) {
      const color = hexToRgb(route.color);
      route.stops.forEach((stop, i) => {
        const p = project(stop.lat, stop.lon);
        const terminal = i === 0 || i === route.stops.length - 1;
        page.drawCircle({
          x: p.x,
          y: p.y,
          size: terminal ? 4.4 : 3.2,
          color: WHITE,
          borderColor: color,
          borderWidth: terminal ? 2 : 1.5,
        });
      });
    }

    // Labels after all line work so they sit on top. A loop whose two
    // termini share a name (e.g. Kaliwa/Kanan starts and ends at the same
    // mall) gets one label, not two stacked copies.
    const labeledByText = new Map<string, ProjectedPoint>();
    for (const route of drawnRoutes) {
      route.stops.forEach((stop, i) => {
        const p = project(stop.lat, stop.lon);
        const terminal = i === 0 || i === route.stops.length - 1;
        const label = stop.name;
        const size = terminal ? 8 : 7.5;
        const textW = font.widthOfTextAtSize(label, size);
        const seen = labeledByText.get(label);
        if (seen && Math.hypot(seen.x - p.x, seen.y - p.y) < 24) return;
        const candidates: LabelCell[] = [
          { x: p.x - textW / 2, y: p.y + 7 },
          { x: p.x - textW / 2, y: p.y - 15 },
          { x: p.x + 7, y: p.y - 2.5 },
          { x: p.x - textW - 7, y: p.y - 2.5 },
        ];
        const spot =
          candidates.find((c) => grid.free(c.x, c.y)) ??
          (terminal ? candidates[0] : null);
        if (!spot) return;
        grid.claim(spot.x, spot.y);
        labeledByText.set(label, p);
        haloText(
          page,
          label,
          spot.x,
          spot.y,
          size,
          font,
          terminal ? INK : rgb(0.25, 0.25, 0.25),
        );
      });
    }

    // Scale bar (bottom-left of the frame).
    const barMaxPt = 90;
    const meters = niceScaleBarMeters(barMaxPt / ptPerMeter);
    const barPt = meters * ptPerMeter;
    const barY = frame.y + 10;
    const barX = frame.x + 12;
    page.drawLine({
      start: { x: barX, y: barY },
      end: { x: barX + barPt, y: barY },
      thickness: 1.5,
      color: INK,
    });
    for (const dx of [0, barPt / 2, barPt]) {
      page.drawLine({
        start: { x: barX + dx, y: barY - 2.5 },
        end: { x: barX + dx, y: barY + 2.5 },
        thickness: 1.5,
        color: INK,
      });
    }
    page.drawText(meters >= 1000 ? `${meters / 1000} km` : `${meters} m`, {
      x: barX + barPt + 5,
      y: barY - 3,
      size: 7.5,
      font,
      color: INK,
    });

    // North arrow (top-right of the frame).
    const nx = frame.x + frame.w - 22;
    const ny = frame.y + frame.h - 16;
    page.drawSvgPath(
      `M ${nx} ${pageH - (ny + 10)} L ${nx - 4.5} ${pageH - (ny - 6)} L ${nx} ${pageH - (ny - 2)} L ${nx + 4.5} ${pageH - (ny - 6)} Z`,
      { ...svgAnchor, color: INK },
    );
    page.drawText("N", {
      x: nx - 2.5,
      y: ny + 12,
      size: 8,
      font: bold,
      color: INK,
    });
  } else {
    page.drawText("No active routes to map yet.", {
      x: frame.x + frame.w / 2 - 70,
      y: frame.y + frame.h / 2,
      size: 10,
      font,
      color: MUTED,
    });
  }

  // ── "You are here" (drawn last, on top of everything) ─────────────────
  if (here && hereOnFrame && projector) {
    const p = projector.project(here.lat, here.lon);
    page.drawSvgPath(
      `M ${p.x - 13} ${pageH - p.y} a 13 13 0 1 0 26 0 a 13 13 0 1 0 -26 0`,
      {
        ...svgAnchor,
        borderColor: BRAND,
        borderWidth: 1.2,
        borderDashArray: [3, 3],
        borderOpacity: 0.9,
      },
    );
    page.drawSvgPath(starAt(p.x, p.y, 9), {
      ...svgAnchor,
      color: BRAND,
      borderColor: WHITE,
      borderWidth: 1.2,
    });
    const label = `You are here: ${here.name}`;
    const size = 10.5;
    const textW = bold.widthOfTextAtSize(label, size);
    const clampX = (x: number) =>
      Math.min(Math.max(x, frame.x + 4), frame.x + frame.w - textW - 4);
    const candidates = [
      { x: clampX(p.x - textW / 2), y: p.y + 17 },
      { x: clampX(p.x - textW / 2), y: p.y - 21 },
      { x: clampX(p.x + 15), y: p.y - 3.5 },
      { x: clampX(p.x - textW - 15), y: p.y - 3.5 },
    ];
    // Dense core: every near spot may be taken. Walk outward ring by ring
    // (8 angles per ring) so the label lands somewhere free, then tie it to
    // the star with a short leader line.
    for (let r = 30; r <= 78; r += 16) {
      for (let a = 0; a < 8; a++) {
        const rad = (Math.PI / 4) * a;
        const lx = clampX(p.x + Math.cos(rad) * r - textW / 2);
        const ly = p.y + Math.sin(rad) * r;
        if (ly < frame.y + 8 || ly > frame.y + frame.h - 8) continue;
        candidates.push({ x: lx, y: ly });
      }
    }
    const spot =
      candidates.find((c) => grid.free(c.x, c.y, textW)) ?? candidates[0];
    const midX = spot.x + textW / 2;
    const midY = spot.y - 3.5;
    const dx = midX - p.x;
    const dy = midY - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const leaderStart = 15;
    if (len > leaderStart + 4) {
      page.drawLine({
        start: {
          x: p.x + (dx / len) * leaderStart,
          y: p.y + (dy / len) * leaderStart,
        },
        end: { x: midX - (dx / len) * 4, y: midY - (dy / len) * 4 },
        thickness: 0.8,
        color: BRAND,
      });
    }
    haloText(page, label, spot.x, spot.y, size, bold, BRAND);
    grid.claim(spot.x, spot.y, textW);
  }

  // ── Legend ────────────────────────────────────────────────────────────
  const legendTop = FOOTER_H + LEGEND_H;
  const legendY = legendTop - 58; // drawn-route rows sit in the top band
  const legendRowW = (pageW - MARGIN * 2) / Math.max(drawnRoutes.length, 1);
  drawnRoutes.forEach((route, i) => {
    const color = hexToRgb(route.color);
    const x0 = MARGIN + i * legendRowW;
    page.drawLine({
      start: { x: x0, y: legendY + 34 },
      end: { x: x0 + 22, y: legendY + 34 },
      thickness: 4,
      color,
      lineCap: 1,
    });
    page.drawText(route.name, {
      x: x0 + 28,
      y: legendY + 31,
      size: 9.5,
      font: bold,
      color: INK,
    });
    const fares = `PHP ${route.fareRegular} regular · PHP ${route.fareDiscounted} discounted`;
    page.drawText(fares, {
      x: x0 + 28,
      y: legendY + 18,
      size: 8,
      font,
      color: MUTED,
    });
    if (route.directionNote) {
      const note =
        route.directionNote.length > 46
          ? `${route.directionNote.slice(0, 45)}…`
          : route.directionNote;
      page.drawText(note, {
        x: x0 + 28,
        y: legendY + 6,
        size: 8,
        font,
        color: MUTED,
      });
    }
  });
  if (here && !hereOnFrame) {
    page.drawText(`You are here: ${here.name} (outside the campus frame)`, {
      x: MARGIN,
      y: legendY - 8,
      size: 8,
      font: bold,
      color: BRAND,
    });
  }
  // Intercity services stay legend-only: their stops span provinces and would
  // collapse the campus diagram to a dot.
  if (intercityRoutes.length > 0) {
    const intercityTitle = "Also serving UPLB (intercity, not drawn):";
    page.drawText(intercityTitle, {
      x: MARGIN,
      y: legendY - 22,
      size: 8,
      font: bold,
      color: INK,
    });
    const titleW = bold.widthOfTextAtSize(intercityTitle, 8) + 8;
    const maxW = pageW - MARGIN * 2 - titleW;
    const items = intercityRoutes.map(
      (r) => `${r.name} (PHP ${r.fareRegular}/${r.fareDiscounted})`,
    );
    let line = "";
    const lines: string[] = [];
    for (const item of items) {
      const candidate = line ? `${line} · ${item}` : item;
      if (font.widthOfTextAtSize(candidate, 7.5) > maxW && line) {
        lines.push(line);
        line = item;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((text, i) => {
      page.drawText(text, {
        x: MARGIN + titleW,
        y: legendY - 22 - i * 10,
        size: 7.5,
        font,
        color: MUTED,
      });
    });
  }
  if (here && hereOnFrame) {
    const starX = pageW - MARGIN - 150;
    page.drawSvgPath(starAt(starX, legendY + 34, 6), {
      ...svgAnchor,
      color: BRAND,
    });
    page.drawText("You are here", {
      x: starX + 10,
      y: legendY + 30,
      size: 8.5,
      font: bold,
      color: INK,
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────
  page.drawText("Room TBA · room-tba.uplb.tools", {
    x: MARGIN,
    y: FOOTER_H - 12,
    size: 7.5,
    font,
    color: MUTED,
  });
  const footRight =
    "Fares in PHP · Schematic diagram — stop order is exact, paths are indicative";
  const footRightW = font.widthOfTextAtSize(footRight, 7.5);
  page.drawText(footRight, {
    x: pageW - MARGIN - footRightW,
    y: FOOTER_H - 12,
    size: 7.5,
    font,
    color: MUTED,
  });

  return pdf.save();
}
