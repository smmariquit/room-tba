import { db } from "./db";
import { buildingsTable, roomsTable, classesTable, collegesTable, divisionsTable } from "../../drizzle/schema";
import { eq, count, isNotNull } from "drizzle-orm";

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function getAllBuildings() {
  const buildings = await db.select().from(buildingsTable);
  return buildings.map((b) => ({
    ...b,
    slug: slugify(b.building_name),
  }));
}

export async function getAllRooms() {
  const rooms = await db
    .select({
      id: roomsTable.id,
      room_code: roomsTable.room_code,
      building_name: buildingsTable.building_name,
    })
    .from(roomsTable)
    .leftJoin(buildingsTable, eq(roomsTable.building_id, buildingsTable.id));
  return rooms;
}

export async function getBuildingBySlug(slug: string) {
  const buildings = await getAllBuildings();
  return buildings.find((b) => b.slug === slug);
}

export async function getRoomByCode(code: string) {
  const rooms = await db
    .select({
      id: roomsTable.id,
      code: roomsTable.room_code,
      directions: roomsTable.directions,
      building: {
        name: buildingsTable.building_name,
        lat: buildingsTable.lat,
        lon: buildingsTable.lon,
        directions: buildingsTable.directions,
      },
    })
    .from(roomsTable)
    .leftJoin(buildingsTable, eq(roomsTable.building_id, buildingsTable.id))
    .where(eq(roomsTable.room_code, code));
  
  const room = rooms[0];

  if (!room) return null;

  const classes = await db
    .select({
      courseCode: classesTable.course_code,
      roomCode: roomsTable.room_code,
      section: classesTable.section,
      type: classesTable.type,
      schedule: classesTable.schedule,
      directions: roomsTable.directions,
      courseTitle: classesTable.course_title,
    })
    .from(classesTable)
    .leftJoin(roomsTable, eq(roomsTable.id, classesTable.room_id))
    .where(eq(classesTable.room_id, room.id));

  return {
    ...room,
    classes,
  };
}

export async function getAppData() {
  const rooms = await db
    .select({
      id: roomsTable.id,
      code: roomsTable.room_code,
      directions: roomsTable.directions,
      building: {
        name: buildingsTable.building_name,
        lat: buildingsTable.lat,
        lon: buildingsTable.lon,
        directions: buildingsTable.directions,
      },
      collegeName: collegesTable.college_name,
      divisionName: divisionsTable.division_name,
    })
    .from(roomsTable)
    .leftJoin(buildingsTable, eq(buildingsTable.id, roomsTable.building_id))
    .leftJoin(divisionsTable, eq(divisionsTable.id, roomsTable.division_id))
    .leftJoin(collegesTable, eq(collegesTable.id, roomsTable.college_id));

  const classes = await db
    .select({
      courseCode: classesTable.course_code,
      roomCode: roomsTable.room_code,
      section: classesTable.section,
      type: classesTable.type,
      schedule: classesTable.schedule,
      directions: roomsTable.directions,
      courseTitle: classesTable.course_title,
    })
    .from(classesTable)
    .leftJoin(roomsTable, eq(roomsTable.id, classesTable.room_id));

  const buildings = await db.select().from(buildingsTable);
  const colleges = await db.select().from(collegesTable);
  const divisions = await db.select().from(divisionsTable);

  const classesDict = new Map<string, any[]>();
  classes.forEach((classData) => {
    const roomCode = classData.roomCode ?? "No room";
    if (!classesDict.has(roomCode)) {
      classesDict.set(roomCode, [classData]);
    } else {
      classesDict.get(roomCode)?.push(classData);
    }
  });

  rooms.sort((a, b) => {
    const countA = classesDict.get(a.code)?.length ?? 0;
    const countB = classesDict.get(b.code)?.length ?? 0;
    return countB - countA;
  });

  // @ts-ignore
  const [{ count: directionCount }] = await db
    .select({ count: count() })
    .from(roomsTable)
    .where(isNotNull(roomsTable.directions));

  // @ts-ignore
  const [{ count: totalRooms }] = await db
    .select({ count: count() })
    .from(roomsTable);

  return {
    buildings,
    classesMap: classesDict,
    colleges,
    divisions,
    rooms,
    directionCount,
    totalRooms,
  };
}
