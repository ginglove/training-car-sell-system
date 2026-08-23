import { pgTable, uuid, varchar, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const accessoriesCatalog = pgTable("accessories_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  sku: varchar("sku", { length: 50 }).unique(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
