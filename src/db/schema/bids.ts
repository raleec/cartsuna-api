import { doublePrecision, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";
import { tItem } from "./items.js";
import { tCustomer } from "./customers.js";

export const tBid = pgTable("t_bid", {
  bidId: uuid("bid_id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => tItem.itemId),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
  amount: doublePrecision("amount").notNull(),
  state: varchar("state", { length: 25 }).notNull().default("pending"),
  ...templateColumns,
});
