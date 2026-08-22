import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { brands } from "./brands";

export const vehicleModels = pgTable("vehicle_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id),
  name: varchar("name", { length: 100 }).notNull(),
  bodyType: varchar("body_type", { length: 50 }).notNull(),
});
