import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  logoUrl: text("logo_url").notNull(),
});
