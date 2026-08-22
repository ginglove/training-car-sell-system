import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { showrooms } from "./showrooms";
import { vehicleVariants } from "./vehicle-variants";

export const testDriveSlots = pgTable("test_drive_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  showroomId: uuid("showroom_id").notNull().references(() => showrooms.id),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id),
  demoVehicleVin: varchar("demo_vehicle_vin", { length: 17 }),
  assignedSaleId: uuid("assigned_sale_id"),
  slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
  slotEnd: timestamp("slot_end", { withTimezone: true }).notNull(),
  isBooked: boolean("is_booked").default(false),
  customerName: varchar("customer_name", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 15 }),
  gplxNumber: varchar("gplx_number", { length: 30 }),
  gplxImageUrl: varchar("gplx_image_url", { length: 255 }),
  isOnBehalf: boolean("is_on_behalf").default(false),
  bookedByUserId: uuid("booked_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
