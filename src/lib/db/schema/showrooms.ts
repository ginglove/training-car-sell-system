import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const showrooms = pgTable("showrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 30 }).unique().notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
