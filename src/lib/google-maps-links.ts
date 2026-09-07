const curatedPlaceUrls: Record<string, string> = {
  "Electrical Engineering Building":
    "https://www.google.com/maps/place/UPLB+Dante+B.+De+Padua+Hall+(CEAT+Administration+Building)/@14.1614261,121.2479207,19.07z/data=!4m6!3m5!1s0x33bd619058953c0d:0xbc3af31f3d3de971!8m2!3d14.1615904!4d121.2478685!16s%2Fg%2F11s5jspcv0",
};

/** Open a verified place when available, otherwise search for the named entity. */
export function getGoogleMapsPinUrl(
  lat: number,
  lon: number,
  name?: string,
): string {
  if (name && curatedPlaceUrls[name]) return curatedPlaceUrls[name];
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, UPLB, Los Baños`)}`;
  }
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

/** Open Street View at the coordinates via the Maps URLs API (no key needed). */
export function getGoogleStreetViewUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
}
