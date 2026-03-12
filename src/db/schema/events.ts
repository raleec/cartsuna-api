import { integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";

export const tEvent = pgTable("t_event", {
  eventId: uuid("event_id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  image: text("image"),
  quota: integer("quota"),
  cron: varchar("cron", { length: 100 }),
  duration: integer("duration"),
  tags: text("tags").array(),
  ...templateColumns,
});
