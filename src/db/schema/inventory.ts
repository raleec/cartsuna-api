import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";

export const tInventory = pgTable("t_inventory", {
  inventoryId: uuid("inventory_id").primaryKey().defaultRandom(),
  barcode: varchar("barcode", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  tags: text("tags").array(),
  ...templateColumns,
});
