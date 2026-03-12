import { boolean, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { tMerchant } from "./merchants.js";

export const tMerchantInvite = pgTable("t_merchant_invite", {
  inviteId: uuid("invite_id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => tMerchant.merchantId),
  codeHash: varchar("code_hash", { length: 256 }).notNull(),
  label: varchar("label", { length: 100 }),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdTs: timestamp("created_ts", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
});
