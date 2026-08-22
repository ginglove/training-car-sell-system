import { pgTable, uuid, varchar, decimal, jsonb, timestamp, text } from "drizzle-orm/pg-core";
import { vehicleModels } from "./vehicle-models";
import { users } from "./users";

export const vehicleVariants = pgTable("vehicle_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").notNull().references(() => vehicleModels.id),
  variantName: varchar("variant_name", { length: 100 }).notNull(),
  listedPrice: decimal("listed_price", { precision: 15, scale: 2 }).notNull(),
  minDepositAmount: decimal("min_deposit_amount", { precision: 15, scale: 2 }).notNull(),
  specsJson: jsonb("specs_json").notNull(),
});

export const vehiclePriceHistories = pgTable("vehicle_price_histories", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id),
  oldListedPrice: decimal("old_listed_price", { precision: 15, scale: 2 }).notNull(),
  newListedPrice: decimal("new_listed_price", { precision: 15, scale: 2 }).notNull(),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  effectiveDate: timestamp("effective_date", { withTimezone: true }).defaultNow(),
  reason: text("reason"),
});
