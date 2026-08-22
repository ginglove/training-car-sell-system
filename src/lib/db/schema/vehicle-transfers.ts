import { pgTable, uuid, varchar, decimal, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { vehicles } from "./vehicles";
import { showrooms } from "./showrooms";
import { users } from "./users";

export const transferStatusEnum = pgEnum("transfer_status", [
  "REQUESTED",
  "APPROVED",
  "IN_TRANSIT",
  "RECEIVED",
  "TRANSIT_DAMAGED",
  "REJECTED",
  "CANCELED",
]);

export const vehicleTransfers = pgTable("vehicle_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferCode: varchar("transfer_code", { length: 30 }).unique().notNull(),
  vinNumber: varchar("vin_number", { length: 17 }).notNull().references(() => vehicles.vinNumber),
  fromShowroomId: uuid("from_showroom_id").notNull().references(() => showrooms.id),
  toShowroomId: uuid("to_showroom_id").notNull().references(() => showrooms.id),
  logisticsFee: decimal("logistics_fee", { precision: 15, scale: 2 }).notNull().default("0"),
  transferTransitDamageNotes: text("transfer_transit_damage_notes"),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  status: transferStatusEnum("status").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
