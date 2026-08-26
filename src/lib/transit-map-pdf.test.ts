import { describe, expect, test } from "bun:test";
import { PDFDocument } from "pdf-lib";
import {
  isCampusScopeRoute,
  makeProjector,
  metersPerDegreeLon,
  niceScaleBarMeters,
  renderTransitMapPdf,
  starPath,
  smoothPath,
  toWinAnsi,
  type TransitMapRoute,
} from "./transit-map-pdf";

const route = (overrides: Partial<TransitMapRoute> = {}): TransitMapRoute => ({
  id: "kaliwa-kanan",
  name: "Kaliwa / Kanan",
  color: "#dc2626",
  fareRegular: 13,
  fareDiscounted: 9,
  directionNote: "Loop through the campus core",
  stops: [
    { name: "Gate", lat: 14.1685, lon: 121.2414 },
    { name: "Palma Hall", lat: 14.1698, lon: 121.2453 },
    { name: "CEAT", lat: 14.1628, lon: 121.2497 },
  ],
  ...overrides,
});

describe("metersPerDegreeLon", () => {
  test("shrinks with latitude", () => {
    const equator = metersPerDegreeLon(0);
    const campus = metersPerDegreeLon(14.17);
    expect(equator).toBeCloseTo(111320, -2);
    expect(campus).toBeLessThan(equator);
    expect(campus).toBeGreaterThan(100_000);
  });
});

describe("makeProjector", () => {
  const frame = { x: 50, y: 50, w: 400, h: 300 };

  test("returns null with no points", () => {
    expect(makeProjector([], frame)).toBeNull();
  });

  test("fits points inside the frame and preserves aspect", () => {
    const projector = makeProjector(
      [
        { lat: 14.13, lon: 121.24 },
        { lat: 14.18, lon: 121.26 },
      ],
      frame,
    );
    expect(projector).not.toBeNull();
    const { project } = projector!;
    for (const [lat, lon] of [
      [14.13, 121.24],
      [14.18, 121.26],
      [14.155, 121.25],
    ]) {
      const p = project(lat, lon);
      expect(p.x).toBeGreaterThanOrEqual(frame.x);
      expect(p.x).toBeLessThanOrEqual(frame.x + frame.w);
      expect(p.y).toBeGreaterThanOrEqual(frame.y);
      expect(p.y).toBeLessThanOrEqual(frame.y + frame.h);
    }
    // North must stay up: a higher latitude projects to a larger y.
    const south = project(14.13, 121.25);
    const north = project(14.18, 121.25);
    expect(north.y).toBeGreaterThan(south.y);
  });
});

describe("smoothPath", () => {
  test("empty points give an empty path", () => {
    expect(smoothPath([])).toBe("");
  });

  test("two points are a straight segment", () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(d).toMatch(/^M 0 0 L 10 10$/);
  });

  test("three or more points use quadratic midpoints", () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);
    expect(d).toContain("Q 10 10 15 5");
    expect(d.endsWith("L 20 0")).toBe(true);
  });
});

describe("starPath", () => {
  test("starts at the top point and closes", () => {
    const d = starPath(100, 100, 10);
    expect(d.startsWith("M 100 90 ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/L /g)).toHaveLength(9);
  });
});

describe("niceScaleBarMeters", () => {
  test("picks the largest human length that fits", () => {
    expect(niceScaleBarMeters(90)).toBe(50);
    expect(niceScaleBarMeters(260)).toBe(250);
    expect(niceScaleBarMeters(5000)).toBe(2000);
    expect(niceScaleBarMeters(10)).toBe(50);
  });
});

describe("toWinAnsi", () => {
  test("maps arrows and typography the standard fonts cannot encode", () => {
    expect(toWinAnsi("Buendia → Los Baños")).toBe("Buendia -> Los Baños");
    expect(toWinAnsi("A ↔ B • C")).toBe("A <-> B - C");
  });

  test("drops unencodable codepoints instead of failing the render", () => {
    expect(toWinAnsi("Route \u2192 \u2603")).toBe("Route -> ");
    expect(toWinAnsi("Kaliwa / Kanan")).toBe("Kaliwa / Kanan");
  });
});

describe("isCampusScopeRoute", () => {
  test("campus loop is drawn, intercity service is legend-only", () => {
    expect(
      isCampusScopeRoute(
        route({
          stops: [
            { name: "Gate", lat: 14.1685, lon: 121.2414 },
            { name: "CEAT", lat: 14.1628, lon: 121.2497 },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      isCampusScopeRoute(
        route({
          name: "Buendia → Los Baños",
          stops: [
            { name: "Buendia", lat: 14.5586, lon: 121.0198 },
            { name: "LB Terminal", lat: 14.1685, lon: 121.2414 },
          ],
        }),
      ),
    ).toBe(false);
  });
});

describe("renderTransitMapPdf", () => {
  test("renders a valid PDF with metadata for two routes and a here marker", async () => {
    const bytes = await renderTransitMapPdf({
      routes: [
        route(),
        route({
          id: "forestry",
          name: "Forestry",
          color: "#15803d",
          stops: [
            { name: "Gate", lat: 14.1685, lon: 121.2414 },
            { name: "Forestry", lat: 14.148, lon: 121.2402 },
          ],
        }),
      ],
      here: { name: "Riceworld Museum", lat: 14.1684, lon: 121.2545 },
    });

    const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
    expect(header).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(2000);

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("UPLB Transit Map — Jeepney Routes");
    expect(pdf.getAuthor()).toBe("Room TBA");
  });

  test("renders the empty-state without routes", async () => {
    const bytes = await renderTransitMapPdf({ routes: [] });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBeTruthy();
  });

  test("survives intercity routes with unencodable names", async () => {
    const bytes = await renderTransitMapPdf({
      routes: [
        route(),
        route({
          id: "buendia",
          name: "Buendia → Los Baños",
          stops: [
            { name: "Buendia", lat: 14.5586, lon: 121.0198 },
            { name: "LB Terminal", lat: 14.1685, lon: 121.2414 },
          ],
        }),
      ],
      here: { name: "Riceworld Museum", lat: 14.1684, lon: 121.2545 },
    });
    const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
    expect(header).toBe("%PDF-");
  });

  test("accepts the letter format", async () => {
    const a4 = await renderTransitMapPdf({ routes: [route()], format: "a4" });
    const letter = await renderTransitMapPdf({
      routes: [route()],
      format: "letter",
    });
    const a4pdf = await PDFDocument.load(a4);
    const letterPdf = await PDFDocument.load(letter);
    const a4size = a4pdf.getPage(0).getSize();
    const lsize = letterPdf.getPage(0).getSize();
    expect(lsize.width).toBeCloseTo(792, 0);
    expect(lsize.height).toBeCloseTo(612, 0);
    expect(a4size.width).toBeGreaterThan(lsize.width);
    expect(a4size.height).toBeLessThan(lsize.height);
  });
});
