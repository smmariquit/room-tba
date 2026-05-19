import { sqliteTable } from "drizzle-orm/sqlite-core";

export const buildingsTable = sqliteTable("buildings", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  building_name: s.text("building_name").notNull(),
  lat: s.real("lat"),
  lon: s.real("lon"),
  directions: s.text("directions"),
}));

export const dormsTable = sqliteTable("dorms", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  dorm_name: s.text("dorm_name").notNull(),
  short_name: s.text("short_name"),
  lat: s.real("lat"),
  lon: s.real("lon"),
  gender: s.text("gender").notNull(), // "male" | "female" | "coed"
  capacity: s.integer("capacity"),
  managing_office: s.text("managing_office"),
  contact_email: s.text("contact_email"),
  amenities: s.text("amenities"), // JSON stringified array
  osm_link: s.text("osm_link"),
  description: s.text("description"),
  is_up_managed: s.integer("is_up_managed", { mode: "boolean" }).notNull().default(true),
  price_range: s.text("price_range"), // e.g. "₱2,500-₱4,000/mo" (to be verified by user)
  contact_phone: s.text("contact_phone"),
  facebook_link: s.text("facebook_link"),
}));

export const collegesTable = sqliteTable("colleges", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  college_name: s.text("college_name").notNull(),
}));

export const divisionsTable = sqliteTable("divisions", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  division_name: s.text("division_name").notNull(),
}));

export const roomsTable = sqliteTable("rooms", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  room_code: s.text("room_code").notNull(),
  directions: s.text("directions"),
  building_id: s.integer("building_id").references(() => buildingsTable.id),
  college_id: s.integer("college_id").references(() => collegesTable.id),
  division_id: s.integer("division_id").references(() => divisionsTable.id),
}));

export const classesTable = sqliteTable("classes", (s) => ({
  id: s.integer("id").primaryKey({ autoIncrement: true }),
  course_code: s.text("course_code").notNull(),
  section: s.text("section").notNull(),
  type: s.text("type").notNull(),
  schedule: s.text("schedule").notNull(),
  term_id: s.integer("term_id"),
  room_id: s
    .integer("room_id")
    .notNull()
    .references(() => roomsTable.id),
  course_title: s.text("course_title").notNull(),
}));
