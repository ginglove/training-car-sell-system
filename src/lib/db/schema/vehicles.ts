import { pgTable, uuid, varchar, integer, boolean, timestamp, text, index, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { vehicleVariants } from "./vehicle-variants";
import { showrooms } from "./showrooms";
import { users } from "./users";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "AVAILABLE",
  "LOCKED",
  "RESERVED",
  "SOLD",
  "TRANSFERRING",
]);

export const originTypeEnum = pgEnum("origin_type", ["CKD", "CBU"]);

export const vehicles = pgTable("vehicles", {
  vinNumber: varchar("vin_number", { length: 17 }).primaryKey(),
  engineNumber: varchar("engine_number", { length: 30 }).unique().notNull(),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id),
  color: varchar("color", { length: 50 }).notNull(),
  manufacturingYear: integer("manufacturing_year").notNull().default(2026),
  originType: originTypeEnum("origin_type").notNull().default("CKD"),
  showroomId: uuid("showroom_id").notNull().references(() => showrooms.id),
  reservedForPhone: varchar("reserved_for_phone", { length: 15 }),
  status: vehicleStatusEnum("status").notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxAvailableCars: index("idx_available_cars").on(table.variantId, table.color, table.showroomId).where(sql`status = 'AVAILABLE'`),
}));

export const vinHoldReservations = pgTable("vin_hold_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  vinNumber: varchar("vin_number", { length: 17 }).unique().notNull().references(() => vehicles.vinNumber),
  heldByManagerId: uuid("held_by_manager_id").notNull().references(() => users.id),
  customerPhone: varchar("customer_phone", { length: 15 }).notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  orderId: uuid("order_id"),
  holdReason: text("hold_reason").notNull(),
  holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
