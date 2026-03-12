import { doublePrecision, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { tMerchant } from "./merchants.js";
import { tInventory } from "./inventory.js";

export const tItem = pgTable("t_item", {
  itemId: uuid("item_id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  inventoryId: uuid("inventory_id").references(() => tInventory.inventoryId),
  name: varchar("name", { length: 255 }).notNull(),
  desc: text("desc"),
  image: text("image"),
  unitPrice: doublePrecision("unit_price"),
  tax: doublePrecision("tax"),
  tags: text("tags").array(),
  status: varchar("status", { length: 25 }).notNull().default("active"),
});
