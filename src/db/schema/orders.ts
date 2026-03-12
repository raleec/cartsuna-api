import { integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { tItem } from "./items.js";
import { tItemAvailability } from "./itemAvailability.js";

export const tOrder = pgTable("t_order", {
  orderId: uuid("order_id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => tItem.itemId),
  availabilityId: uuid("availability_id").references(() => tItemAvailability.availabilityId),
  itemCount: integer("item_count").notNull().default(1),
  memo: text("memo"),
  state: varchar("state", { length: 25 }).notNull().default("pending"),
});
