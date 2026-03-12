import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";
import { tCustomer } from "./customers.js";
import { tItem } from "./items.js";
import { tMerchant } from "./merchants.js";

export const tReview = pgTable("t_review", {
  reviewId: uuid("review_id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
  itemId: uuid("item_id")
    .notNull()
    .references(() => tItem.itemId),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  rating: integer("rating").notNull(),
  body: text("body"),
  ...templateColumns,
});
