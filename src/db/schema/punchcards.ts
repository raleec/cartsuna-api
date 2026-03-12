import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";
import { tCustomer } from "./customers.js";
import { tMerchant } from "./merchants.js";

export const tPunchcard = pgTable("t_punchcard", {
  punchcardId: uuid("punchcard_id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => tCustomer.customerId),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  punches: integer("punches").notNull().default(0),
  maxPunches: integer("max_punches").notNull().default(10),
  ...templateColumns,
});
