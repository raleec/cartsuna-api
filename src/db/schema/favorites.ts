import { pgTable, uuid } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";
import { tCustomer } from "./customers.js";
import { tItem } from "./items.js";

export const tFavorite = pgTable("t_favorite", {
  favoriteId: uuid("favorite_id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
  itemId: uuid("item_id")
    .notNull()
    .references(() => tItem.itemId),
  ...templateColumns,
});
