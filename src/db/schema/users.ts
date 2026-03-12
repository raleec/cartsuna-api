import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const tUser = pgTable("t_user", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passphrase: varchar("passphrase", { length: 256 }).notNull(),
  role: varchar("role", { length: 25 }).notNull(),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  name: varchar("name", { length: 50 }).notNull(),
});
