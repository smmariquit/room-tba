import { describe, expect, test } from "bun:test";
import {
  getGoogleMapsPinUrl,
  getGoogleStreetViewUrl,
} from "./google-maps-links";

describe("getGoogleMapsPinUrl", () => {
  test("uses a verified Google Maps place URL when one is curated", () => {
    expect(
      getGoogleMapsPinUrl(
        14.1615806166946,
        121.247839677519,
        "Electrical Engineering Building",
      ),
    ).toBe(
      "https://www.google.com/maps/place/UPLB+Dante+B.+De+Padua+Hall+(CEAT+Administration+Building)/@14.1614261,121.2479207,19.07z/data=!4m6!3m5!1s0x33bd619058953c0d:0xbc3af31f3d3de971!8m2!3d14.1615904!4d121.2478685!16s%2Fg%2F11s5jspcv0",
    );
  });

  test("searches for a named entity instead of opening raw coordinates", () => {
    expect(getGoogleMapsPinUrl(14.6532, 121.0689, "Test Hall")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Test%20Hall%2C%20UPLB%2C%20Los%20Ba%C3%B1os",
    );
  });

  test("builds a Google Maps query URL from coordinates", () => {
    expect(getGoogleMapsPinUrl(14.6532, 121.0689)).toBe(
      "https://www.google.com/maps?q=14.6532,121.0689",
    );
  });
});

describe("getGoogleStreetViewUrl", () => {
  test("builds a Maps URLs API pano viewpoint URL", () => {
    expect(getGoogleStreetViewUrl(14.16497, 121.24132)).toBe(
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=14.16497,121.24132",
    );
  });
});
