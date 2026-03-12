import { boolean, integer, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { templateColumns } from "./template.js";

export const tMerchant = pgTable("t_merchant", {
  merchantId: uuid("merchant_id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  schedule: text("schedule"),
  quota: integer("quota"),
  description: text("description"),
  tags: text("tags").array(),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  welcomeMessage: text("welcome_message"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),
  isPrivate: boolean("is_private").notNull().default(false),
  tier: varchar("tier", { length: 50 }),
  countryCode: varchar("country_code", { length: 10 }),
  ...templateColumns,
});
