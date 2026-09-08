import type {
  AnnouncementData,
  BuildingData,
  CollegeData,
  DivisionData,
  DormData,
  EventData,
  OrgData,
  PlaceData,
  RoomData,
  TableSyncInfo,
} from "@lib/types";
import { getDB } from "./pgliteDB";
import { syncToastStore } from "@lib/store.svelte";
import type { Results } from "@electric-sql/pglite";
import { getSyncKey, getSyncKeysFromLs } from "./sync-keys";
import type { JeepneyRoute } from "@constants/jeepney-routes";

export { getSyncKey, getSyncKeysFromLs };

async function localCacheIsEmpty(tableName: string): Promise<boolean> {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const result = (await localDB.query(
      `SELECT 1 FROM "${tableName}" LIMIT 1;`,
    )) as Results<Record<string, unknown>>;
    return result.rows.length === 0;
  } catch {
    return true;
  }
}

async function shouldSkipValidSync(
  checker: TableSyncInfo,
  tableName: string,
): Promise<boolean> {
  if (!checker.valid) return false;
  return !(await localCacheIsEmpty(tableName));
}

export async function localTableSyncCheck(
  tableName: string,
): Promise<TableSyncInfo> {
  try {
    const remoteSyncKey = await getSyncKey(tableName);
    const syncKeyLs = getSyncKeysFromLs();
    if (syncKeyLs === null)
      return {
        valid: false,
        newKey: remoteSyncKey,
      };
    const tableSyncKey = syncKeyLs[tableName];
    return {
      valid:
        typeof tableSyncKey === "string" &&
        remoteSyncKey !== null &&
        tableSyncKey === remoteSyncKey,
      newKey: remoteSyncKey,
    };
  } catch (e) {
    console.error(e);
    return {
      valid: false,
      newKey: null,
    };
  }
}

export function updateSyncKeyFromLs(tableName: string, newKey: string) {
  const syncKeys = getSyncKeysFromLs();
  if (syncKeys === null) return;
  syncKeys[tableName] = newKey;
  localStorage.setItem("sync-key", JSON.stringify(syncKeys));
}

export async function syncBuildings(
  checker: TableSyncInfo,
  remoteBuildings: BuildingData[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("buildings");
  if (await shouldSkipValidSync(checker, "buildings")) return;
  // Offline (sync endpoint unreachable): keep the local cache rather than
  // overwriting it with empty remote data or resetting rooms_fetched (#169).
  if (checker.newKey === null) return;
  if (!trustedRemote) return;
  const localDB = await getDB();

  await localDB.waitReady;
  syncToastStore.startBuildingsSync(remoteBuildings.length);
  for (const b of remoteBuildings) {
    try {
      await localDB.query(
        `
        INSERT INTO buildings (id, building_name, lon, lat, directions, type, rooms_fetched, image_url, cr_facilities, version, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
        id = EXCLUDED.id,
        building_name = EXCLUDED.building_name,
        lon = EXCLUDED.lon,
        lat = EXCLUDED.lat,
        directions = EXCLUDED.directions,
        type = EXCLUDED.type,
        rooms_fetched = EXCLUDED.rooms_fetched,
        image_url = EXCLUDED.image_url,
        cr_facilities = EXCLUDED.cr_facilities,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          b.id,
          b.buildingName,
          b.lon,
          b.lat,
          b.directions,
          b.buildingType,
          b.imageUrl ?? null,
          b.crFacilities ?? null,
          b.version,
          b.updatedAt,
        ],
      );
      syncToastStore.updateBuildingsSync();
    } catch (e) {
      console.error(e);
    }
  }
  if (trustedRemote) {
    updateSyncKeyFromLs("buildings", checker.newKey ?? "");
  }
}

export async function syncColleges(
  checker: TableSyncInfo,
  remoteColleges: CollegeData[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("colleges");
  if (await shouldSkipValidSync(checker, "colleges")) return;
  // Offline (sync endpoint unreachable): keep the local cache rather than
  // overwriting it with empty remote data or empty sync keys (#169).
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();

  await localDB.waitReady;
  syncToastStore.startCollegesSync(remoteColleges.length);
  for (const college of remoteColleges) {
    try {
      await localDB.query(
        `
        INSERT INTO colleges (id, college_name, website_link, rooms_fetched, version, updated_at)
        VALUES ($1, $2, $3, false, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
        id = EXCLUDED.id,
        college_name = EXCLUDED.college_name,
        website_link = EXCLUDED.website_link,
        rooms_fetched = EXCLUDED.rooms_fetched,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          college.id,
          college.collegeName,
          college.websiteLink ?? null,
          college.version,
          college.updatedAt,
        ],
      );
      syncToastStore.updateCollegesSync();
    } catch (e) {
      console.error(e);
    }
  }

  if (trustedRemote) {
    updateSyncKeyFromLs("colleges", checker.newKey ?? "");
  }
}

export async function syncDivisions(
  checker: TableSyncInfo,
  remoteDivisions: DivisionData[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("divisions");
  if (await shouldSkipValidSync(checker, "divisions")) return;
  // Offline (sync endpoint unreachable): keep the local cache rather than
  // overwriting it with empty remote data or empty sync keys (#169).
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();

  await localDB.waitReady;
  syncToastStore.startDivisionsSync(remoteDivisions.length);
  for (const division of remoteDivisions) {
    try {
      await localDB.query(
        `
        INSERT INTO divisions (id, division_name, college_id, website_link, rooms_fetched, version, updated_at)
        VALUES ($1, $2, $3, $4, false, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
        id = EXCLUDED.id,
        division_name = EXCLUDED.division_name,
        college_id = EXCLUDED.college_id,
        website_link = EXCLUDED.website_link,
        rooms_fetched = EXCLUDED.rooms_fetched,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          division.id,
          division.divisionName,
          division.collegeId,
          division.websiteLink ?? null,
          division.version,
          division.updatedAt,
        ],
      );
      syncToastStore.updateDivisionsSync();
    } catch (e) {
      console.error(e);
    }
  }
  if (trustedRemote) {
    updateSyncKeyFromLs("divisions", checker.newKey ?? "");
  }
}

export async function syncDorms(
  checker: TableSyncInfo,
  remoteDorms: DormData[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("dorms");
  if (await shouldSkipValidSync(checker, "dorms")) return;
  // Offline (sync endpoint unreachable): keep the local cache rather than
  // overwriting it with empty remote data or empty sync keys (#169).
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();

  await localDB.waitReady;
  syncToastStore.startDormsSync(remoteDorms.length);
  for (const b of remoteDorms) {
    try {
      await localDB.query(
        `
        INSERT INTO dorms (id, dorm_name, short_name, lat, lon, gender, capacity, managing_office, contact_email, amenities, osm_link, description, is_up_managed, price_range, contact_phone, facebook_link, image_url, version, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
        id = EXCLUDED.id,
        dorm_name = EXCLUDED.dorm_name,
        short_name = EXCLUDED.short_name,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        gender = EXCLUDED.gender,
        capacity = EXCLUDED.capacity,
        managing_office = EXCLUDED.managing_office,
        contact_email = EXCLUDED.contact_email,
        amenities = EXCLUDED.amenities,
        osm_link = EXCLUDED.osm_link,
        description = EXCLUDED.description,
        is_up_managed = EXCLUDED.is_up_managed,
        price_range = EXCLUDED.price_range,
        contact_phone = EXCLUDED.contact_phone,
        facebook_link = EXCLUDED.facebook_link,
        image_url = EXCLUDED.image_url,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          b.id,
          b.dormName,
          b.shortName,
          b.lat,
          b.lon,
          b.gender,
          b.capacity,
          b.managingOffice,
          b.contactEmail,
          b.amenities ?? null,
          b.osmLink,
          b.description,
          b.isUpManaged,
          b.priceRange,
          b.contactPhone,
          b.facebookLink,
          b.imageUrl ?? null,
          b.version,
          b.updatedAt,
        ],
      );
      syncToastStore.updateDormsSync();
    } catch (e) {
      console.error(e);
    }
  }
  if (trustedRemote) {
    updateSyncKeyFromLs("dorms", checker.newKey ?? "");
  }
}

export async function syncOrganizations(
  checker: TableSyncInfo,
  remoteOrgs: OrgData[],
  trustedRemote = false,
) {
  if (await shouldSkipValidSync(checker, "organizations")) return;
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();
  await localDB.waitReady;
  for (const o of remoteOrgs) {
    try {
      await localDB.query(
        `
        INSERT INTO organizations (id, name, category, building_id, room_id, lat, lon, description, website_link, facebook_link, email, image_url, bio, org_type, established_year, member_count, version, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        building_id = EXCLUDED.building_id,
        room_id = EXCLUDED.room_id,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        description = EXCLUDED.description,
        website_link = EXCLUDED.website_link,
        facebook_link = EXCLUDED.facebook_link,
        email = EXCLUDED.email,
        image_url = EXCLUDED.image_url,
        bio = EXCLUDED.bio,
        org_type = EXCLUDED.org_type,
        established_year = EXCLUDED.established_year,
        member_count = EXCLUDED.member_count,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          o.id,
          o.name,
          o.category,
          o.buildingId,
          o.roomId,
          o.lat,
          o.lon,
          o.description,
          o.websiteLink,
          o.facebookLink,
          o.email,
          o.imageUrl ?? null,
          o.bio ?? null,
          o.orgType ?? null,
          o.establishedYear ?? null,
          o.memberCount ?? null,
          o.version,
          o.updatedAt,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  if (trustedRemote) {
    updateSyncKeyFromLs("organizations", checker.newKey ?? "");
  }
}

export async function syncPlaces(
  checker: TableSyncInfo,
  remotePlaces: PlaceData[],
  trustedRemote = false,
) {
  if (await shouldSkipValidSync(checker, "places")) return;
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();
  await localDB.waitReady;
  for (const p of remotePlaces) {
    try {
      await localDB.query(
        `
        INSERT INTO places (id, name, category, lat, lon, description, hours, website_link, facebook_link, image_url, version, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        description = EXCLUDED.description,
        hours = EXCLUDED.hours,
        website_link = EXCLUDED.website_link,
        facebook_link = EXCLUDED.facebook_link,
        image_url = EXCLUDED.image_url,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          p.id,
          p.name,
          p.category,
          p.lat,
          p.lon,
          p.description,
          p.hours,
          p.websiteLink,
          p.facebookLink,
          p.imageUrl ?? null,
          p.version,
          p.updatedAt,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  if (trustedRemote) {
    updateSyncKeyFromLs("places", checker.newKey ?? "");
  }
}

export async function syncAnnouncements(
  checker: TableSyncInfo,
  remoteAnnouncements: AnnouncementData[],
  trustedRemote = false,
) {
  if (await shouldSkipValidSync(checker, "announcements")) return;
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();
  await localDB.waitReady;
  // `/api/announcements` serves only live rows, so rows that expired or were
  // deleted server-side must leave the cache too — replace, don't upsert.
  try {
    await localDB.query("DELETE FROM announcements;");
  } catch (e) {
    console.error(e);
  }
  for (const a of remoteAnnouncements) {
    try {
      await localDB.query(
        `
        INSERT INTO announcements (id, title, body, severity, starts_on, ends_on, link_url, author, created_at, version, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        severity = EXCLUDED.severity,
        starts_on = EXCLUDED.starts_on,
        ends_on = EXCLUDED.ends_on,
        link_url = EXCLUDED.link_url,
        author = EXCLUDED.author,
        created_at = EXCLUDED.created_at,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at;
        `,
        [
          a.id,
          a.title,
          a.body,
          a.severity,
          a.startsOn,
          a.endsOn,
          a.linkUrl,
          a.author,
          a.createdAt,
          a.version,
          a.updatedAt,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  updateSyncKeyFromLs("announcements", checker.newKey ?? "");
}

export async function syncJeepneyRoutes(
  checker: TableSyncInfo,
  routes: JeepneyRoute[],
  trustedRemote = false,
) {
  if (await shouldSkipValidSync(checker, "jeepney_routes")) return;
  if (checker.newKey === null || !trustedRemote) return;

  const localDB = await getDB();
  await localDB.waitReady;
  try {
    await localDB.transaction(async (tx) => {
      await tx.exec("DELETE FROM jeepney_stops; DELETE FROM jeepney_routes;");
      for (const route of routes) {
        await tx.query(
          `INSERT INTO jeepney_routes (id, name, description, direction_note, color, fare_regular, fare_discounted)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [
            route.id,
            route.name,
            route.description,
            route.directionNote ?? null,
            route.color,
            route.fare.regular,
            route.fare.discounted,
          ],
        );
        for (const stop of route.stops) {
          if (stop.id === undefined) continue;
          await tx.query(
            `INSERT INTO jeepney_stops (id, route_id, name, description, lat, lon, sort_order, version, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
            [
              stop.id,
              route.id,
              stop.name,
              stop.description,
              stop.lat,
              stop.lon,
              stop.sortOrder ?? 0,
              stop.version ?? 1,
              stop.updatedAt ?? new Date().toISOString(),
            ],
          );
        }
      }
    });
    updateSyncKeyFromLs("jeepney_routes", checker.newKey);
  } catch (error) {
    console.error(
      "Failed to sync jeepney routes; keeping previous cache",
      error,
    );
  }
}

export async function syncEvents(
  checker: TableSyncInfo,
  remoteEvents: EventData[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("events");
  if (await shouldSkipValidSync(checker, "events")) return;
  // Offline (sync endpoint unreachable): keep the local cache rather than
  // overwriting it with empty remote data or empty sync keys (#169).
  if (checker.newKey === null) return;
  if (!trustedRemote) return;

  const localDB = await getDB();
  await localDB.waitReady;
  syncToastStore.startEventsSync(remoteEvents.length);

  // Events span four related tables, so the cache rebuild must be all-or-nothing.
  // Run it inside a single transaction: any failure rolls back the delete +
  // partial inserts, and we leave the sync key untouched so the stale-but-complete
  // cache is retried on the next sync instead of being marked up to date.
  try {
    await localDB.transaction(async (tx) => {
      await tx.exec(`
        DELETE FROM event_route_stops;
        DELETE FROM event_routes;
        DELETE FROM event_locations;
        DELETE FROM events;
      `);

      for (const event of remoteEvents) {
        await tx.query(
          `
        INSERT INTO events (
          id, slug, title, description, category, starts_at, ends_at, timezone,
          recurrence, is_active, source_url, image_url, priority, include_in_seo, version,
          updated_at, status, occurrence_starts_at, occurrence_ends_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19);
        `,
          [
            event.id,
            event.slug,
            event.title,
            event.description,
            event.category,
            event.startsAt,
            event.endsAt,
            event.timezone,
            event.recurrence,
            event.isActive,
            event.sourceUrl,
            event.imageUrl,
            event.priority,
            event.includeInSeo,
            event.version,
            event.updatedAt,
            event.status,
            event.occurrenceStartsAt,
            event.occurrenceEndsAt,
          ],
        );

        for (const location of event.locations) {
          await tx.query(
            `
          INSERT INTO event_locations (
            id, event_id, anchor_type, building_id, dorm_id, label, lat, lon,
            highlight_priority, sort_order, is_primary, updated_at, resolved_lat,
            resolved_lon, resolved_label, building_name, dorm_name
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
          `,
            [
              location.id,
              location.eventId,
              location.anchorType,
              location.buildingId,
              location.dormId,
              location.label,
              location.lat,
              location.lon,
              location.highlightPriority,
              location.sortOrder,
              location.isPrimary,
              location.updatedAt,
              location.resolvedLat,
              location.resolvedLon,
              location.resolvedLabel,
              location.buildingName,
              location.dormName,
            ],
          );
        }

        for (const route of event.routes) {
          await tx.query(
            `
          INSERT INTO event_routes (id, event_id, name, description, sort_order, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6);
          `,
            [
              route.id,
              route.eventId,
              route.name,
              route.description,
              route.sortOrder,
              route.updatedAt,
            ],
          );

          for (const stop of route.stops) {
            await tx.query(
              `
            INSERT INTO event_route_stops (
              id, route_id, event_location_id, label, lat, lon, sort_order,
              updated_at, resolved_lat, resolved_lon, resolved_label
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
            `,
              [
                stop.id,
                stop.routeId,
                stop.eventLocationId,
                stop.label,
                stop.lat,
                stop.lon,
                stop.sortOrder,
                stop.updatedAt,
                stop.resolvedLat,
                stop.resolvedLon,
                stop.resolvedLabel,
              ],
            );
          }
        }

        syncToastStore.updateEventsSync();
      }
    });
  } catch (e) {
    console.error("Failed to sync events; keeping previous cache", e);
    return;
  }

  if (trustedRemote) {
    updateSyncKeyFromLs("events", checker.newKey ?? "");
  }
}

export async function resetBuildingsSyncStatus() {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    await localDB.exec("UPDATE buildings SET rooms_fetched = false");
  } catch (e) {
    console.error(e);
  }
}

export async function localBuildingSyncStatus(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
            SELECT rooms_fetched AS "roomsFetched"
            FROM buildings
            WHERE id = $1
        `,
      [id],
    )) as Results<{ roomsFetched: boolean }>;
    return data.rows[0];
  } catch (e) {
    console.error(e);
  }
}

export async function getLocalBuildingRooms(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
    SELECT
    r.id,
    r.room_code AS code,
    r.full_name AS "fullName",
    r.directions AS directions,
    json_build_object('name',b.building_name, 'lat', b.lat, 'lon', b.lon, 'directions', b.directions ) as building,
    c.college_name as "collegeName",
    d.division_name as "divisionName",
    r.building_id as "buildingId",
    r.college_id as "collegeId",
    r.division_id as "divisionId",
    r.category as category,
    r.version,
    r.updated_at as "updatedAt",
    rp.floor
    FROM rooms AS r
    LEFT JOIN buildings AS b ON b.id = r.building_id
    LEFT JOIN colleges as c ON c.id = r.college_id
    LEFT JOIN divisions AS d ON d.id = r.division_id
    LEFT JOIN room_positions AS rp ON rp.room_id = r.id
    WHERE r.building_id = $1;
    `,
      [id],
    )) as Results<RoomData>;
    return data.rows;
  } catch (e) {
    console.error(e);
  }
}

/** True when the stored rooms sync key matches the live one (online + fresh). */
function roomsSyncKeyMatches(remoteSyncKey: string | null): boolean {
  const syncKeyLs = getSyncKeysFromLs();
  const roomSyncKey = syncKeyLs?.rooms;
  return (
    typeof roomSyncKey === "string" &&
    remoteSyncKey !== null &&
    roomSyncKey === remoteSyncKey
  );
}

export async function checkLocalBuildingRoom(id: number) {
  try {
    const remoteSyncKey = await getSyncKey("rooms");
    const buildingSyncStatus = await localBuildingSyncStatus(id);
    const roomsFetched = !!buildingSyncStatus?.roomsFetched;

    // Offline / sync endpoint unreachable: trust the local cache if present
    // instead of wiping rooms_fetched and forcing a network-only refetch (#169).
    if (remoteSyncKey === null) return roomsFetched;

    // Online and the rooms sync key changed: local rooms are stale, refetch.
    if (!roomsSyncKeyMatches(remoteSyncKey)) {
      await resetBuildingsSyncStatus();
      return false;
    }

    return roomsFetched;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/**
 * Write one room into the local cache.
 *
 * Rooms are the only entity that loads lazily, per building, behind
 * `buildings.rooms_fetched`. Nothing in the campus refresh touches the rooms
 * table, so a room the server just changed stays stale locally until someone
 * reopens its building. Publishing an edit has to write the row itself.
 *
 * Deliberately not `syncBuildingRooms` with a one-room array: that marks the
 * whole building as fetched, which would be a lie about the other rooms.
 */
export async function upsertLocalRoom(room: RoomData): Promise<void> {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    await localDB.query(
      `
            INSERT INTO rooms (id, room_code, directions, building_id, college_id, division_id, image_url, version, updated_at, category, full_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
            room_code = EXCLUDED.room_code,
            directions = EXCLUDED.directions,
            building_id = EXCLUDED.building_id,
            college_id = EXCLUDED.college_id,
            division_id = EXCLUDED.division_id,
            image_url = EXCLUDED.image_url,
            version = EXCLUDED.version,
            updated_at = EXCLUDED.updated_at,
            category = EXCLUDED.category,
            full_name = EXCLUDED.full_name;
            `,
      [
        room.id,
        room.code,
        room.directions,
        room.buildingId,
        room.collegeId,
        room.divisionId,
        room.imageUrl ?? null,
        room.version,
        room.updatedAt,
        room.category ?? null,
        room.fullName ?? null,
      ],
    );
  } catch (e) {
    // A publish must not fail because the local cache did.
    console.error("upsertLocalRoom failed", e);
  }
}

export async function syncBuildingRooms(
  validSync: boolean,
  id: number,
  rooms: RoomData[],
) {
  if (validSync) return;
  // Offline/failed fetch returns no rooms — keep the existing cache and the
  // rooms_fetched flag untouched instead of marking an empty fetch as done.
  if (!rooms || rooms.length === 0) return;
  const localDB = await getDB();
  for (const room of rooms) {
    try {
      await localDB.query(
        `
            INSERT INTO rooms (id, room_code, directions, building_id, college_id, division_id, image_url, version, updated_at, category, full_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
            id = EXCLUDED.id,
            room_code = EXCLUDED.room_code,
            directions = EXCLUDED.directions,
            building_id = EXCLUDED.building_id,
            college_id = EXCLUDED.college_id,
            division_id = EXCLUDED.division_id,
            image_url = EXCLUDED.image_url,
            version = EXCLUDED.version,
            updated_at = EXCLUDED.updated_at,
            category = EXCLUDED.category,
            full_name = EXCLUDED.full_name;
            `,
        [
          room.id,
          room.code,
          room.directions,
          room.buildingId,
          room.collegeId,
          room.divisionId,
          room.imageUrl ?? null,
          room.version,
          room.updatedAt,
          room.category ?? null,
          room.fullName ?? null,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  await localDB.query(
    "UPDATE buildings SET rooms_fetched = true WHERE id = $1",
    [id],
  );
}

export async function resetCollegesSyncStatus() {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    await localDB.exec("UPDATE colleges SET rooms_fetched = false");
  } catch (e) {
    console.error(e);
  }
}

export async function localCollegeSyncStatus(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
            SELECT rooms_fetched as "roomsFetched"
            FROM colleges
            WHERE id = $1;
        `,
      [id],
    )) as Results<{ roomsFetched: boolean }>;
    return data.rows[0];
  } catch (e) {
    console.error(e);
  }
}

export async function getLocalCollegeRooms(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
    SELECT
    r.id,
    r.room_code AS code,
    r.full_name AS "fullName",
    r.directions AS directions,
    json_build_object('name',b.building_name, 'lat', b.lat, 'lon', b.lon, 'directions', b.directions ) as building,
    c.college_name as "collegeName",
    d.division_name as "divisionName",
    r.building_id as "buildingId",
    r.college_id as "collegeId",
    r.division_id as "divisionId",
    r.version,
    r.updated_at as "updatedAt"
    FROM rooms AS r
    LEFT JOIN buildings AS b ON b.id = r.building_id
    LEFT JOIN colleges as c ON c.id = r.college_id
    LEFT JOIN divisions AS d ON d.id = r.division_id
    WHERE r.college_id = $1;
    `,
      [id],
    )) as Results<RoomData>;
    return data.rows;
  } catch (e) {
    console.error(e);
  }
}

export async function checkLocalCollegeRoom(id: number) {
  try {
    const remoteSyncKey = await getSyncKey("rooms");
    const collegeSyncStatus = await localCollegeSyncStatus(id);
    const roomsFetched = !!collegeSyncStatus?.roomsFetched;

    // Offline: trust local cache instead of wiping it (#169).
    if (remoteSyncKey === null) return roomsFetched;

    if (!roomsSyncKeyMatches(remoteSyncKey)) {
      await resetCollegesSyncStatus();
      return false;
    }

    return roomsFetched;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function syncCollegeRooms(
  validSync: boolean,
  id: number,
  rooms: RoomData[],
) {
  if (validSync) return;
  if (!rooms || rooms.length === 0) return;
  const localDB = await getDB();
  for (const room of rooms) {
    try {
      await localDB.query(
        `
            INSERT INTO rooms (id, room_code, directions, building_id, college_id, division_id, image_url, version, updated_at, category, full_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
            id = EXCLUDED.id,
            room_code = EXCLUDED.room_code,
            directions = EXCLUDED.directions,
            building_id = EXCLUDED.building_id,
            college_id = EXCLUDED.college_id,
            division_id = EXCLUDED.division_id,
            image_url = EXCLUDED.image_url,
            version = EXCLUDED.version,
            updated_at = EXCLUDED.updated_at,
            category = EXCLUDED.category,
            full_name = EXCLUDED.full_name;
            `,
        [
          room.id,
          room.code,
          room.directions,
          room.buildingId,
          room.collegeId,
          room.divisionId,
          room.imageUrl ?? null,
          room.version,
          room.updatedAt,
          room.category ?? null,
          room.fullName ?? null,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  await localDB.query(
    "UPDATE colleges SET rooms_fetched = true WHERE id = $1",
    [id],
  );
}

export async function resetDivisionsSyncStatus() {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    await localDB.exec("UPDATE divisions SET rooms_fetched = false");
  } catch (e) {
    console.error(e);
  }
}

export async function localDivisionSyncStatus(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
            SELECT rooms_fetched as "roomsFetched"
            FROM divisions
            WHERE id = $1;
        `,
      [id],
    )) as Results<{ roomsFetched: boolean }>;
    return data.rows[0];
  } catch (e) {
    console.error(e);
  }
}

export async function getLocalDivisionRooms(id: number) {
  try {
    const localDB = await getDB();
    await localDB.waitReady;
    const data = (await localDB.query(
      `
    SELECT
    r.id,
    r.room_code AS code,
    r.full_name AS "fullName",
    r.directions AS directions,
    json_build_object('name',b.building_name, 'lat', b.lat, 'lon', b.lon, 'directions', b.directions ) as building,
    c.college_name as "collegeName",
    d.division_name as "divisionName",
    r.building_id as "buildingId",
    r.college_id as "collegeId",
    r.division_id as "divisionId",
    r.version,
    r.updated_at as "updatedAt"
    FROM rooms AS r
    LEFT JOIN buildings AS b ON b.id = r.building_id
    LEFT JOIN colleges as c ON c.id = r.college_id
    LEFT JOIN divisions AS d ON d.id = r.division_id
    WHERE r.division_id = $1;
    `,
      [id],
    )) as Results<RoomData>;
    return data.rows;
  } catch (e) {
    console.error(e);
  }
}

export async function checkLocalDivisionRoom(id: number) {
  try {
    const remoteSyncKey = await getSyncKey("rooms");
    const divisionSyncStatus = await localDivisionSyncStatus(id);
    const roomsFetched = !!divisionSyncStatus?.roomsFetched;

    // Offline: trust local cache instead of wiping it (#169).
    if (remoteSyncKey === null) return roomsFetched;

    if (!roomsSyncKeyMatches(remoteSyncKey)) {
      await resetDivisionsSyncStatus();
      return false;
    }

    return roomsFetched;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function syncDivisionRooms(
  validSync: boolean,
  id: number,
  rooms: RoomData[],
) {
  if (validSync) return;
  if (!rooms || rooms.length === 0) return;
  const localDB = await getDB();
  for (const room of rooms) {
    try {
      await localDB.query(
        `
            INSERT INTO rooms (id, room_code, directions, building_id, college_id, division_id, image_url, version, updated_at, category, full_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
            id = EXCLUDED.id,
            room_code = EXCLUDED.room_code,
            directions = EXCLUDED.directions,
            building_id = EXCLUDED.building_id,
            college_id = EXCLUDED.college_id,
            division_id = EXCLUDED.division_id,
            image_url = EXCLUDED.image_url,
            version = EXCLUDED.version,
            updated_at = EXCLUDED.updated_at,
            category = EXCLUDED.category,
            full_name = EXCLUDED.full_name;
            `,
        [
          room.id,
          room.code,
          room.directions,
          room.buildingId,
          room.collegeId,
          room.divisionId,
          room.imageUrl ?? null,
          room.version,
          room.updatedAt,
          room.category ?? null,
          room.fullName ?? null,
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }
  await localDB.query(
    "UPDATE divisions SET rooms_fetched = true WHERE id = $1",
    [id],
  );
}

/** Refresh the local alias cache from the server when online (#155 follow-up). */
export async function syncAliasCache() {
  syncToastStore.markWritingPhase("aliases");
  try {
    const response = await fetch("/api/aliases?export=all");
    if (!response.ok) return;
    const payload = (await response.json()) as {
      data?: {
        id: number;
        alias: string;
        normalizedAlias: string;
        targetType: string;
        targetId: number;
        value: string | null;
      }[];
    };
    const rows = payload.data;
    if (!Array.isArray(rows)) return;

    const localDB = await getDB();
    await localDB.waitReady;
    await localDB.exec("DELETE FROM aliases");
    if (rows.length === 0) return;

    syncToastStore.startAliasesSync(rows.length);
    for (const row of rows) {
      await localDB.query(
        `
        INSERT INTO aliases (id, alias, normalized_alias, target_type, target_id, building_name)
        VALUES ($1, $2, $3, $4, $5, $6);
        `,
        [
          row.id,
          row.alias,
          row.normalizedAlias,
          row.targetType,
          row.targetId,
          row.value,
        ],
      );
      syncToastStore.updateAliasesSync();
    }
  } catch (e) {
    console.error(e);
  }
}

/** Sync classes into PGlite cache (#231). */
export async function syncClasses(
  checker: TableSyncInfo,
  remoteClasses: {
    id: number;
    courseCode: string;
    section: string;
    type: string;
    schedule: string;
    directions: string | null;
    courseTitle: string;
    termId: number;
    roomId: number | null;
  }[],
  trustedRemote = false,
) {
  syncToastStore.markWritingPhase("classes");
  if (!trustedRemote) return;
  if (checker.newKey === null) return;

  const localDB = await getDB();
  await localDB.waitReady;
  syncToastStore.startClassesSync(remoteClasses.length);

  try {
    await localDB.exec("DELETE FROM classes");
    for (const c of remoteClasses) {
      await localDB.query(
        `
        INSERT INTO classes (id, course_code, section, type, schedule, directions, course_title, term_id, room_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `,
        [
          c.id,
          c.courseCode,
          c.section,
          c.type,
          c.schedule,
          c.directions,
          c.courseTitle,
          c.termId,
          c.roomId,
        ],
      );
      syncToastStore.updateClassesSync();
    }
    updateSyncKeyFromLs("classes", checker.newKey ?? "");
  } catch (e) {
    console.error("Failed to sync classes", e);
  }
}
