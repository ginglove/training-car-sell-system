import { pgTable, uuid, varchar, date, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().references(() => users.id, { onDelete: "cascade" }),
  identityCardNumber: varchar("identity_card_number", { length: 255 }).notNull(),
  identityCardMasked: varchar("identity_card_masked", { length: 20 }).notNull(),
  identityCardDate: date("identity_card_date").notNull(),
  identityCardPlace: varchar("identity_card_place", { length: 150 }).notNull(),
  permanentAddress: text("permanent_address").notNull(),
  monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
