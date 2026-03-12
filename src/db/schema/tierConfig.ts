import { integer, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";

export const tTierConfig = pgTable("t_tier_config", {
  tierConfigId: uuid("tier_config_id").primaryKey().defaultRandom(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull(),
  maxCustomersPerMonth: integer("max_customers_per_month"),
  maxOrdersPerMonth: integer("max_orders_per_month"),
  ...templateColumns,
});
