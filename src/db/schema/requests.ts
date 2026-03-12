import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { tCustomer } from "./customers.js";
import { tMerchant } from "./merchants.js";
import { tOrder } from "./orders.js";

export const tRequest = pgTable("t_request", {
  requestId: uuid("request_id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
  orderId: uuid("order_id").references(() => tOrder.orderId),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  title: varchar("title", { length: 255 }).notNull(),
  desc: text("desc"),
  eta: timestamp("eta", { withTimezone: true }),
  status: varchar("status", { length: 25 }).notNull().default("open"),
});
