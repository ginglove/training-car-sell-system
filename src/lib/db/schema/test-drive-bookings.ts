import { pgTable, uuid, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { testDriveSlots } from "./test-drive-slots";
import { users } from "./users";

export const testDriveBookings = pgTable("test_drive_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => testDriveSlots.id),
  customerUserId: uuid("customer_user_id").references(() => users.id),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 15 }).notNull(),
  driverLicense: varchar("driver_license", { length: 12 }),
  isOnBehalf: boolean("is_on_behalf").default(false),
  onBehalfCustomerName: varchar("on_behalf_customer_name", { length: 100 }),
  onBehalfCustomerPhone: varchar("on_behalf_customer_phone", { length: 15 }),
  status: varchar("status", { length: 30 }).default("CONFIRMED").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
