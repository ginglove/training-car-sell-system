import { pgTable, uuid, varchar, integer, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { vehicleVariants } from "./vehicle-variants";
import { showrooms } from "./showrooms";

export const vehicleQuotas = pgTable("vehicle_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id),
  color: varchar("color", { length: 50 }).notNull(),
  showroomId: uuid("showroom_id").notNull().references(() => showrooms.id),
  totalPhysicalCount: integer("total_physical_count").notNull().default(0),
  softLockedCount: integer("soft_locked_count").notNull().default(0),
  availableQuota: integer("available_quota").generatedAlwaysAs(sql`total_physical_count - soft_locked_count`),
}, (table) => ({
  uniqueVariantColorShowroom: unique("unique_variant_color_showroom").on(table.variantId, table.color, table.showroomId),
}));
