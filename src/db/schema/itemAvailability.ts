import { doublePrecision, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";
import { tItem } from "./items.js";
import { tMerchant } from "./merchants.js";

export const tItemAvailability = pgTable("t_item_availability", {
  availabilityId: uuid("availability_id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => tItem.itemId),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  locationName: varchar("location_name", { length: 255 }),
  locationAddr: text("location_addr"),
  startTs: timestamp("start_ts", { withTimezone: true }).notNull(),
  endTs: timestamp("end_ts", { withTimezone: true }).notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
  rrule: text("rrule"),
  recurrenceEnd: timestamp("recurrence_end", { withTimezone: true }),
  quota: integer("quota"),
  booked: integer("booked").notNull().default(0),
  unitPrice: doublePrecision("unit_price"),
  tax: doublePrecision("tax"),
  tags: text("tags").array(),
  ...templateColumns,
});
