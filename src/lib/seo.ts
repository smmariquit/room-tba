/**
 * SEO helpers: slugs, canonical URLs, and JSON-LD schemas for individual
 * building / room pages.
 */

export const SITE_URL = "https://room-tba.stimmie.dev";
export const SITE_NAME = "Room TBA";
export const DEFAULT_OG_IMAGE = "/socmed.png";

/**
 * Convert a free-form name (building, room code, etc.) into a stable URL slug.
 *  - lowercased
 *  - non-alphanumerics collapsed to a single dash
 *  - dashes trimmed from edges
 *  - "&" -> "and" so "Bio & Chem" doesn't become "bio-chem"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildingPath(buildingName: string): string {
  return `/building/${slugify(buildingName)}`;
}

export function roomPath(roomCode: string): string {
  return `/room/${slugify(roomCode)}`;
}

export function buildingUrl(buildingName: string): string {
  return `${SITE_URL}${buildingPath(buildingName)}`;
}

export function roomUrl(roomCode: string): string {
  return `${SITE_URL}${roomPath(roomCode)}`;
}

export function homeUrl(): string {
  return `${SITE_URL}/`;
}

type BuildingForSchema = {
  name: string;
  lat: number | null;
  lon: number | null;
  directions: string | null;
  rooms: { code: string }[];
};

type RoomForSchema = {
  code: string;
  buildingName: string | null;
  buildingLat: number | null;
  buildingLon: number | null;
  collegeName: string | null;
  divisionName: string | null;
};

/**
 * Place JSON-LD for a building. Includes contained rooms as `containedInPlace`
 * inverse pointers via @id references when possible.
 */
export function buildingJsonLd(
  building: BuildingForSchema,
): Record<string, unknown> {
  const id = buildingUrl(building.name);
  const geo =
    building.lat !== null && building.lon !== null
      ? {
          "@type": "GeoCoordinates",
          latitude: building.lat,
          longitude: building.lon,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": id,
    name: building.name,
    url: id,
    description:
      building.directions ??
      `Building on the UPLB Los Baños campus. View its rooms and class schedules on Room TBA.`,
    ...(geo ? { geo } : {}),
    containedInPlace: {
      "@type": "EducationalOrganization",
      name: "University of the Philippines Los Baños",
      url: "https://uplb.edu.ph",
    },
    amenityFeature: building.rooms.map((r) => ({
      "@type": "LocationFeatureSpecification",
      name: r.code,
      url: roomUrl(r.code),
    })),
  };
}

/** Place JSON-LD for an individual room. */
export function roomJsonLd(room: RoomForSchema): Record<string, unknown> {
  const id = roomUrl(room.code);
  const geo =
    room.buildingLat !== null && room.buildingLon !== null
      ? {
          "@type": "GeoCoordinates",
          latitude: room.buildingLat,
          longitude: room.buildingLon,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": id,
    name: room.code,
    url: id,
    description: `Classroom ${room.code}${
      room.buildingName ? ` in ${room.buildingName}` : ""
    } on the UPLB Los Baños campus. View its class schedule on Room TBA.`,
    ...(geo ? { geo } : {}),
    ...(room.buildingName
      ? {
          containedInPlace: {
            "@type": "Place",
            name: room.buildingName,
            url: buildingUrl(room.buildingName),
          },
        }
      : {}),
    ...(room.collegeName
      ? {
          memberOf: {
            "@type": "EducationalOrganization",
            name: room.collegeName,
          },
        }
      : {}),
  };
}

/** Site-wide WebSite + SearchAction schema for the homepage. */
export function siteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: SITE_URL,
    name: SITE_NAME,
    description:
      "Find rooms, classes, and buildings across the University of the Philippines Los Baños campus.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
