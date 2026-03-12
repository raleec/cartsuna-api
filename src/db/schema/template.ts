import { timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const templateColumns = {
  status: varchar("status", { length: 25 }).notNull().default("active"),
  createdTs: timestamp("created_ts", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
  updatedTs: timestamp("updated_ts", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").notNull(),
};
