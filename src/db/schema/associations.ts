import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { tMerchant } from "./merchants.js";
import { tCustomer } from "./customers.js";

export const tBluetoothSession = pgTable("t_bluetooth_session", {
  sessionId: uuid("session_id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  customerId: uuid("customer_id").references(() => tCustomer.customerId),
  state: varchar("state", { length: 25 }).notNull().default("active"),
  createdTs: timestamp("created_ts", { withTimezone: true }).notNull().defaultNow(),
  updatedTs: timestamp("updated_ts", { withTimezone: true }).notNull().defaultNow(),
});

export const tMerchantCustomer = pgTable("t_merchant_customer", {
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
});
