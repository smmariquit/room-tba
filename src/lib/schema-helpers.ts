export function generateBuildingSchema(building: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Building",
    "@id": `${url}#building`,
    "name": building.building_name,
    "description": `University building at UPLB: ${building.building_name}`,
    "url": url,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Los Baños",
      "addressRegion": "Laguna",
      "addressCountry": "PH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": building.lat,
      "longitude": building.lon
    }
  };
}

export function generateRoomSchema(room: any, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Room",
    "@id": `${url}#room`,
    "name": room.code,
    "description": `Room ${room.code} in ${room.building?.name} at UPLB`,
    "containedInPlace": {
      "@type": "Building",
      "name": room.building?.name,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": room.building?.lat,
        "longitude": room.building?.lon
      }
    },
    "url": url
  };
}
