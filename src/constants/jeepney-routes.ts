// src/constants/jeepney-routes.ts

import type { LineString } from "geojson";

export type JeepneyStop = {
  /** Database id; absent only in the bundled offline fallback. */
  id?: number;
  name: string;
  description: string;
  lat: number;
  lon: number;
  sortOrder?: number;
  version?: number;
  updatedAt?: string;
};

export type JeepneyFare = {
  /** Cash fare in PHP. */
  regular: number;
  /** Student / senior / PWD fare in PHP. */
  discounted: number;
};

export type JeepneyRoute = {
  id: string;
  name: string;
  description: string;
  /** How to read the stop order, e.g. Kaliwa vs Kanan running the loop in
   * opposite directions. Shown prominently in the route modal. */
  directionNote?: string;
  color: string;
  fare: JeepneyFare;
  stops: JeepneyStop[];
};

/** Campus jeepney fares are set campus-wide, not per route. */
export const JEEPNEY_FARE_NOTE =
  "Indicative fare for the 2025-2026 school year; confirm with the driver.";

const STANDARD_CAMPUS_FARE: JeepneyFare = { regular: 13, discounted: 11 };

/** Fallback route line when no road-snapped geometry exists: a straight
 * polyline through the route's stops, in GeoJSON [lon, lat] order. */
export function deriveRouteLineFromStops(
  stops: JeepneyStop[],
): LineString | null {
  if (stops.length < 2) return null;
  return {
    type: "LineString",
    coordinates: stops.map((stop) => [stop.lon, stop.lat]),
  };
}

/**
 * Where a route's drawn line came from, worst-case last. A car-routed path
 * between two bus stops is a *plausible* road path, not necessarily the one the
 * vehicle takes, and a stops-only line is not a road path at all — so the
 * distinction is shown to the rider rather than hidden in the data.
 */
export type RouteGeometrySource = "osm-relation" | "routed" | "stops-only";

/** An entry of `src/constants/jeepney-geometries.json`. */
export type StoredRouteGeometry = {
  source: Exclude<RouteGeometrySource, "stops-only">;
  /** Which relation or routing pass produced it; for maintainers, not the UI. */
  note?: string;
  /**
   * Route-specific honesty note shown instead of the generic one, for lines
   * that are sourced yet still qualified — a reversed relation, a corridor
   * trimmed at our own end points, an alignment OSM and the operator disagree
   * on. Sourced does not always mean settled.
   */
  caveat?: string;
  geometry: LineString;
};

export type ResolvedRouteGeometry = {
  source: RouteGeometrySource;
  /** Null when a route has neither stored geometry nor two stops to join. */
  line: LineString | null;
  /** What to tell the rider, or null when nothing needs qualifying. */
  caveat: string | null;
};

/** Rider-facing caveat per source; `null` where the line is sourced, not guessed. */
export const ROUTE_GEOMETRY_NOTES: Record<RouteGeometrySource, string | null> =
  {
    "osm-relation": null,
    routed:
      "This line is road-routed between the stops, not traced from the operator's published route. Expect the real trip to differ in places.",
    "stops-only":
      "The exact path of this route is not mapped yet. The dashed line just joins the stops in order — it is not the road the vehicle takes.",
  };

/**
 * Pick the best available line for a route and say where it came from.
 * Sourced geometry wins; otherwise fall back to joining the stops, which is
 * drawn as provisional rather than passed off as a road path.
 */
export function resolveRouteGeometry(
  route: Pick<JeepneyRoute, "id" | "stops">,
  geometries: Record<string, StoredRouteGeometry | undefined>,
): ResolvedRouteGeometry {
  const stored = geometries[route.id];
  if (stored?.geometry?.coordinates?.length) {
    return {
      source: stored.source,
      line: stored.geometry,
      // A route-specific caveat replaces the generic one; it is more accurate
      // about why this particular line is qualified.
      caveat: stored.caveat ?? ROUTE_GEOMETRY_NOTES[stored.source],
    };
  }
  return {
    source: "stops-only",
    line: deriveRouteLineFromStops(route.stops),
    caveat: ROUTE_GEOMETRY_NOTES["stops-only"],
  };
}

export const JEEPNEY_ROUTES: JeepneyRoute[] = [
  {
    id: "kaliwa-kanan",
    name: "Kaliwa / Kanan",
    description:
      "Loop between Olivarez Plaza in Los Baños town and the UPLB academic core, passing Raymundo Gate, the Main Library, the dormitories, and CEAT.",
    directionNote:
      "Kaliwa and Kanan are the same loop; the name says which way the jeep turns after entering the UPLB gate. Kanan follows the stops as listed (Carabao Park / DevCom first); Kaliwa serves the same stops in reverse (Carabao Park / Landbank first). Across Freedom Park a jeep may pass either the Student Union or the Dormitories; ask the driver which way it goes.",
    color: "#dc2626",
    fare: STANDARD_CAMPUS_FARE,
    stops: [
      {
        name: "Olivarez Plaza Mall",
        description:
          "Town-side terminal and common transfer point near Olivarez Plaza.",
        lat: 14.17903,
        lon: 121.23908,
      },
      {
        name: "Robinsons Town Mall",
        description: "Town-side stop beside Robinsons Los Baños.",
        lat: 14.177349211032917,
        lon: 121.24242089688644,
      },
      {
        name: "Carabao Park / DevCom",
        description:
          "Campus-core stop by Carabao Park and the College of Development Communication.",
        lat: 14.167680673655115,
        lon: 121.24302990984792,
      },
      {
        name: "Raymundo Gate",
        description:
          "Gate-side stop along Raymundo Road, linking town and campus.",
        lat: 14.16773707639881,
        lon: 121.2416075132719,
      },
      {
        name: "CAP-CSI",
        description:
          "Stop near the College of Arts and Sciences and campus service offices.",
        lat: 14.167227355646022,
        lon: 121.24044598783846,
      },
      {
        name: "Sacay",
        description:
          "Central-campus stop on the route between Raymundo Gate and the library.",
        lat: 14.166436241690047,
        lon: 121.23861696327558,
      },
      {
        name: "Main Library",
        description:
          "Stop beside the UPLB Main Library and the central academic core.",
        lat: 14.165440954550126,
        lon: 121.2386041983236,
      },
      {
        name: "Graduate School / Umali",
        description:
          "Stop serving the Graduate School and the Umali Hall area.",
        lat: 14.163742377049818,
        lon: 121.23998877527784,
      },
      {
        name: "Women's Dormitory",
        description: "Stop by the Women's Dormitory residence halls.",
        lat: 14.162362067987052,
        lon: 121.24056837513993,
      },
      {
        name: "Men's Dormitory",
        description: "Stop by the Men's Dormitory residence halls.",
        lat: 14.16091203484906,
        lon: 121.2412408051354,
      },
      {
        name: "Baker Hall",
        description: "Stop near Baker Hall and nearby student services.",
        lat: 14.161219041586817,
        lon: 121.24257006568956,
      },
      {
        name: "Animal Husbandry",
        description: "Stop serving the Animal and Dairy Sciences area.",
        lat: 14.15989413929804,
        lon: 121.24366990769977,
      },
      {
        name: "Agronomy Building",
        description: "Stop close to the Agronomy academic buildings.",
        lat: 14.160182373364517,
        lon: 121.2443733752706,
      },
      {
        name: "CEAT",
        description:
          "Stop for the College of Engineering and Agro-Industrial Technology classrooms and laboratories.",
        lat: 14.16087221013792,
        lon: 121.24495080555562,
      },
      {
        name: "Senior's Social Garden",
        description:
          "Stop beside the Senior's Social Garden in the campus core.",
        lat: 14.162690186117826,
        lon: 121.2438403651636,
      },
      {
        name: "Headquarters",
        description: "Stop near the UPLB administrative headquarters area.",
        lat: 14.16352431907233,
        lon: 121.2437220269563,
      },
      {
        name: "St. Therese / Math Building",
        description:
          "Stop near St. Therese and Mathematics classroom buildings.",
        lat: 14.165120117289403,
        lon: 121.24456008780996,
      },
      {
        name: "Makiling School",
        description:
          "Stop beside the UP Rural High School / Makiling School area.",
        lat: 14.165744564457338,
        lon: 121.24426410223518,
      },
      {
        name: "Carabao Park / Landbank",
        description: "Campus-core stop by Carabao Park and the LandBank area.",
        lat: 14.167026218728786,
        lon: 121.24373658223566,
      },
      {
        name: "Olivarez Plaza Mall",
        description:
          "Town-side terminal and common transfer point near Olivarez Plaza.",
        lat: 14.17903,
        lon: 121.23908,
      },
    ],
  },
  {
    id: "forestry",
    name: "Forestry",
    description:
      "Connects the campus core to the upper Forestry campus: from the Forestry jeep terminal past Narra Bridge, the University Health Service, and CPAf, climbing past Makiling Botanic Gardens to the College of Forestry and Natural Resources and the FOREHA, New FOREHA, and MAREHA residence halls.",
    directionNote:
      "Uphill the jeep serves the stops as listed, ending at MAREHA. It then comes back down the same road, except it goes straight along Makiling Road instead of turning left again at the Admin Building, so downhill riders board the same stops in reverse.",
    color: "#d97706",
    fare: STANDARD_CAMPUS_FARE,
    stops: [
      {
        name: "Forestry Jeep Terminal",
        description: "Terminal for the uphill route to the Forestry campus.",
        lat: 14.16809105957495,
        lon: 121.24248142545251,
      },
      {
        name: "CEM Jeepney Stop",
        description:
          "Stop serving the College of Economics and Management area.",
        lat: 14.167744858385788,
        lon: 121.24160128212628,
      },
      {
        name: "OVCRE Annex Building",
        description:
          "Stop near the Office of the Vice Chancellor for Research and Extension annex.",
        lat: 14.167161010311109,
        lon: 121.24043389915563,
      },
      {
        name: "Narra Bridge",
        description: "Stop by Narra Bridge on the approach to upper campus.",
        lat: 14.164723828661357,
        lon: 121.23847671766336,
      },
      {
        name: "Maria Makiling Statue",
        description:
          "Stop beside the Maria Makiling statue along the Forestry route.",
        lat: 14.163961515861006,
        lon: 121.23821626095294,
      },
      {
        name: "UP University Health Service",
        description: "Stop serving the University Health Service.",
        lat: 14.161996442247391,
        lon: 121.23868610580267,
      },
      {
        name: "CPAf",
        description:
          "Stop serving the College of Public Affairs and Development on the climb to the upper campus.",
        lat: 14.16031,
        lon: 121.237609,
      },
      {
        name: "Makiling Botanic Gardens",
        description: "Stop at the Makiling Botanic Gardens entrance.",
        lat: 14.156688,
        lon: 121.233989,
      },
      {
        name: "Forestry Admin Building",
        description:
          "Stop at the College of Forestry and Natural Resources administration building.",
        lat: 14.154433,
        lon: 121.234541,
      },
      {
        name: "Forest Biological Sciences Building",
        description:
          "Upper-campus stop near the Forest Biological Sciences Building.",
        lat: 14.154716857167369,
        lon: 121.2360341113496,
      },
      {
        name: "Upper Forestry Jeep Terminal",
        description:
          "Upper-campus terminal just southeast (behind) the Forestry Admin Building.",
        // ponytail: eyeballed ~30 m SE of the admin building, no sourced pin yet.
        lat: 14.15425,
        lon: 121.2348,
      },
      {
        name: "Forestry Residence Hall (FOREHA)",
        description: "Stop at the Forestry Residence Hall.",
        lat: 14.152468,
        lon: 121.234908,
      },
      {
        name: "New Forestry Residence Hall (New FOREHA)",
        description: "Stop at the New Forestry Residence Hall.",
        lat: 14.152119,
        lon: 121.234358,
      },
      {
        name: "Makiling Residence Hall (MAREHA)",
        description:
          "Last uphill stop, at the Makiling Residence Hall; the jeep heads back down campus from here.",
        lat: 14.151829,
        lon: 121.235084,
      },
    ],
  },
  {
    id: "up-rural",
    name: "UP Rural / Jubileeville",
    description:
      "Runs from the campus core out along Pili Drive past IRRI and IPB to Putho Tuntungin, Paciano Rizal, UP Rural High School, and Jubileeville in Bay.",
    directionNote:
      "Outbound the jeep serves the stops as listed, ending at Jubileeville; it returns to campus along the same road in reverse.",
    color: "#1e3a8a",
    fare: STANDARD_CAMPUS_FARE,
    stops: [
      {
        name: "Makiling School",
        description:
          "Stop beside the UP Rural High School / Makiling School area.",
        lat: 14.165744564457338,
        lon: 121.24426410223518,
      },
      {
        name: "Old Rural-Saint Therese",
        description:
          "Stop near St. Therese and the old UP Rural High School site.",
        lat: 14.165120117289403,
        lon: 121.24456008780996,
      },
      {
        name: "CEAT Library",
        description: "Stop near the CEAT Library on the way out to Pili Drive.",
        // ponytail: anchored to the CEAT building pin; exact roadside stop unverified.
        lat: 14.162271,
        lon: 121.247953,
      },
      {
        name: "Pili Drive",
        description: "Stop along Pili Drive between campus and IRRI.",
        // ponytail: midpoint estimate on Pili Drive itself, verify on the ground.
        lat: 14.1654,
        lon: 121.2517,
      },
      {
        name: "IRRI",
        description:
          "Stop at the International Rice Research Institute; IRRI Station on the PNR South Haul line is nearby.",
        lat: 14.168834,
        lon: 121.255221,
      },
      {
        name: "Putho Tuntungin",
        description: "Stop in Barangay Putho-Tuntungin, Los Baños.",
        lat: 14.1514804,
        lon: 121.2524347,
      },
      {
        name: "IPB",
        description: "Stop at the Institute of Plant Breeding.",
        lat: 14.151468,
        lon: 121.262073,
      },
      {
        name: "Paciano Rizal",
        description: "Stop in Barangay Paciano Rizal, Bay.",
        lat: 14.1524888,
        lon: 121.2665505,
      },
      {
        name: "UP Rural High",
        description: "Stop at the UP Rural High School campus in Bay.",
        lat: 14.1517146,
        lon: 121.271828,
      },
      {
        name: "Jubileeville",
        description: "End of the route at Jubileeville subdivision, Bay.",
        lat: 14.1494971,
        lon: 121.2744736,
      },
    ],
  },
];

/**
 * Rider tips transcribed from the UPLB Public Transit System Map (2024) by
 * Bernardo "Berniemack" Muerong Arellano III, shown in the route modal with
 * credit. Facts only; the map artwork itself is CC BY-NC-SA and is not reused.
 */
export const JEEPNEY_RIDING_NOTES: string[] = [
  "Jeepneys from Calamba Crossing carry a UP COLLEGE or COLLEGE signboard; they may become Kaliwa, Kanan, Forestry, or UP Gate routes near campus. Check the windshield signboard or ask the driver.",
  "A UP GATE signboard means the jeep stops at Grove and does not enter campus.",
  "Hailing a jeep bound for Forestry or Upper Campus? Point your index finger upwards.",
  "Outbound signboards: BAYAN (town proper), OLIVAREZ (College Junction), SM CROSSING, CROSSING CALAMBA, SAKAY/LALAKAY.",
  "Campus stops have no official names or markers; hail or alight anywhere safe along the route.",
];

export const TRANSIT_DATA_CREDIT =
  'Route data cross-checked with the UPLB Public Transit System Map (2024) by Bernardo "Berniemack" Muerong Arellano III.';
