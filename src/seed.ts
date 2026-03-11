import Database from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  buildingsTable,
  classesTable,
  collegesTable,
  divisionsTable,
  roomsTable,
} from "../drizzle/schema";
import { getTableColumns, eq } from "drizzle-orm";
const client = new Database("../data/info.db");
import appData from "../data/app_data.json";
const db = drizzle({ client });

console.log(await db.select().from(roomsTable))
/* 

===========================================================
FOR SEEDING THE DATABASE with buildings, 
colleges, and divisions VIA app_data.json
===========================================================

const buildings = Object.entries(appData.buildings);
const colleges = Object.entries(appData.colleges);
const divisions = Object.entries(appData.divisions);

await db.insert(buildingsTable).values(
  buildings.map(([building_name, { lat, lon, directions }]) => ({
    building_name,
    lat,
    lon,
    directions,
  })),
);

await db.insert(collegesTable).values(
  colleges.map(([college_name]) => ({ college_name })),
);

await db.insert(divisionsTable).values(
  divisions.map(([division_name]) => ({ division_name })),
); */

/* 
===========================================================
FOR SEEDING THE DATABASE with rooms after other tables
are seeded
===========================================================


const rooms = await Promise.all(
  Object.entries(appData.rooms).map(async ([room_code, room_data]) => {
    const { id: college_id } = room_data.college
      ? (
          await db
            .select({ id: collegesTable.id })
            .from(collegesTable)
            .where(eq(collegesTable.college_name, room_data.college))
        )[0]
      : { id: null };
    const { id: building_id } = room_data.building
      ? (
          await db
            .select({ id: buildingsTable.id })
            .from(buildingsTable)
            .where(eq(buildingsTable.building_name, room_data.building))
        )[0]
      : { id: null };
    const { id: division_id } = room_data.division
      ? ((
          await db
            .select({ id: divisionsTable.id })
            .from(divisionsTable)
            .where(eq(divisionsTable.division_name, room_data.division))
        )[0] ?? { id: null })
      : { id: null };
    return {
      room_code,
      division_id,
      college_id,
      building_id,
      directions: "directions" in room_data ? room_data.directions : null,
    };
  }),
);
await db.insert(roomsTable).values(rooms); */


/* 
===========================================================
AFTER SEEDING THE ROOMS TABLE, THE CLASSES TABLE WAS
SEED
===========================================================

const classes: ((typeof appData.rooms)["212B"]["classes"][number] & {
  room_code: string;
})[] = [];

Object.entries(appData.rooms).forEach(([room_code, room_data]) => {
  if ("classes" in room_data) {
    room_data.classes.forEach((val) => {
      classes.push({ ...val, room_code });
    });
  }
});

const classInsert = await Promise.all(
  classes.map(async ({room_code, course_code,course_title, section, type, schedule}) => {
    const { id: room_id } = (
      await db
        .select()
        .from(roomsTable)
        .where(eq(roomsTable.room_code, room_code))
    )[0];
    return {
      course_code,
      course_title,
      section,
      type,
      schedule:schedule.toString(),
      room_id,
      term_id: 1252,
    }
  }),

);

await db.insert(classesTable).values(classInsert)
 */