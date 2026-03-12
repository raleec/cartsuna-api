import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";

export const tCustomer = pgTable("t_customer", {
  customerId: uuid("customer_id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  description: text("description"),
  tags: text("tags").array(),
  ...templateColumns,
});
